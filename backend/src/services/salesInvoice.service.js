// ─── Sales Invoice Service ─────────────────────────────────────
// Handles premium invoice creation, stock updates, and ledger tracking.
// Uses sequential direct Prisma queries — no interactive transactions.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');
const stockService = require('./stock.service');
const ledgerService = require('./ledger.service');

/**
 * Get all sales invoices with search and filters.
 * Uses sequential queries for serverless stability.
 */
const getAll = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (query.search) {
    where.OR = [
      { invoiceNo: { contains: query.search, mode: 'insensitive' } },
      { customerName: { contains: query.search, mode: 'insensitive' } },
      { customerPhone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.invoiceType) where.invoiceType = query.invoiceType;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const items = await prisma.salesInvoice.findMany({
    where,
    include: { items: true, account: true },
    orderBy: { date: 'desc' },
    skip,
    take: limit,
  });

  const total = await prisma.salesInvoice.count({ where });

  return { items, pagination: buildPagination(total, page, limit) };
};

/**
 * Get a single invoice by ID.
 */
const getById = async (id) => {
  const invoice = await prisma.salesInvoice.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      account: true,
      customer: true
    }
  });
  if (!invoice) throw ApiError.notFound('Invoice not found');
  return invoice;
};

/**
 * Create a new Sales Invoice using sequential direct queries (no transaction block).
 * Order: Generate invoice no → Process items → Record ledger → Handle customer → Save invoice
 */
const create = async (data) => {
  const {
    invoiceType,
    customerId,
    customerName,
    customerPhone,
    customerGstin,
    customerAddress1,
    customerAddress2,
    customerCity,
    customerState,
    customerPincode,
    items,
    discount,
    accountId,
    notes,
    date
  } = data;

  if (!items || items.length === 0) throw ApiError.badRequest('Invoice must have at least one item');
  if (!accountId) throw ApiError.badRequest('Payment account is required');

  const targetDate = date ? new Date(date) : new Date();

  // 1. Generate Invoice Number — sequential query to avoid race conditions
  const year = targetDate.getFullYear();
  const month = String(targetDate.getMonth() + 1).padStart(2, '0');
  const day = String(targetDate.getDate()).padStart(2, '0');
  const prefix = `PV-INV-${year}${month}${day}-`;

  const lastInvoice = await prisma.salesInvoice.findFirst({
    where: { invoiceNo: { startsWith: prefix } },
    orderBy: { invoiceNo: 'desc' }
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNo.split('-').pop(), 10);
    if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
  }

  const invoiceNo = `${prefix}${String(nextSeq).padStart(3, '0')}`;

  // 2. Process Items & Calculate Totals (sequential per item)
  let subtotal = 0;
  let taxAmount = 0;
  let totalProfit = 0;
  const invoiceItems = [];

  for (const item of items) {
    const product = await prisma.product.findUnique({ where: { id: item.productId } });
    if (!product) throw ApiError.notFound(`Product not found: ${item.productId}`);

    const itemAmount = item.qty * item.rate;
    const itemTax = invoiceType === 'GST' ? (itemAmount * (product.gstPercent / 100)) : 0;
    const itemProfit = (item.rate - product.purchasePrice) * item.qty;

    subtotal += itemAmount;
    taxAmount += itemTax;
    totalProfit += itemProfit;

    invoiceItems.push({
      productId: item.productId,
      productName: product.productName,
      hsnCode: product.hsnCode,
      qty: item.qty,
      rate: item.rate,
      purchasePrice: product.purchasePrice,
      gstPercent: product.gstPercent,
      amount: itemAmount
    });

    // 3. Update Stock — sequential call per item
    await stockService.recordMovement({
      productId: item.productId,
      type: 'SALE_OUT',
      quantity: item.qty,
      reference: invoiceNo,
      remark: `Sale Invoice ${invoiceNo}`,
      date: date || new Date()
    });
  }

  const totalAmount = subtotal + taxAmount - (parseFloat(discount) || 0);

  // 4. Record Ledger Transaction (Credit account for sale)
  await ledgerService.recordTransaction({
    accountId,
    date: date || new Date(),
    referenceNo: invoiceNo,
    moduleType: 'SALES_INVOICE',
    description: `Sales Invoice ${invoiceNo} for ${customerName || 'Walk-in Customer'}`,
    credit: totalAmount,
    linkedId: null
  });

  // 5. Create/Update Customer Profile
  let finalCustomerId = customerId;
  const customerPayload = {
    name: customerName,
    phone: customerPhone,
    gstin: customerGstin,
    address1: customerAddress1,
    address2: customerAddress2,
    city: customerCity,
    state: customerState,
    pincode: customerPincode
  };

  if (finalCustomerId) {
    await prisma.customer.update({ where: { id: finalCustomerId }, data: customerPayload });
  } else if (customerName && customerPhone) {
    const existing = await prisma.customer.findFirst({ where: { phone: customerPhone } });
    if (existing) {
      finalCustomerId = existing.id;
      await prisma.customer.update({ where: { id: finalCustomerId }, data: customerPayload });
    } else {
      const newCustomer = await prisma.customer.create({ data: customerPayload });
      finalCustomerId = newCustomer.id;
    }
  }

  // 6. Save Invoice
  const invoice = await prisma.salesInvoice.create({
    data: {
      invoiceNo,
      date: targetDate,
      invoiceType,
      customerId: finalCustomerId,
      customerName,
      customerPhone,
      customerGstin,
      customerAddress1,
      customerAddress2,
      customerCity,
      customerState,
      customerPincode,
      subtotal,
      discount: parseFloat(discount) || 0,
      taxAmount,
      totalAmount,
      profit: totalProfit,
      accountId,
      notes,
      items: { create: invoiceItems }
    },
    include: { items: true }
  });

  return invoice;
};

/**
 * Remove an invoice — reverts stock and ledger using sequential direct queries.
 */
const remove = async (id) => {
  const invoice = await prisma.salesInvoice.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  // 1. Revert Stock for each item sequentially
  for (const item of invoice.items) {
    await stockService.recordMovement({
      productId: item.productId,
      type: 'RETURN_IN',
      quantity: item.qty,
      reference: invoice.invoiceNo,
      remark: `Reverted Sale Invoice ${invoice.invoiceNo}`,
      date: new Date()
    });
  }

  // 2. Revert Ledger (Debit the amount back)
  await ledgerService.recordTransaction({
    accountId: invoice.accountId,
    date: new Date(),
    referenceNo: `REV-${invoice.invoiceNo}`,
    moduleType: 'ADJUSTMENT',
    description: `Reverted Sales Invoice ${invoice.invoiceNo}`,
    debit: invoice.totalAmount,
    linkedId: invoice.id
  });

  // 3. Delete Invoice (cascade handles items)
  await prisma.salesInvoice.delete({ where: { id } });
  return true;
};

module.exports = { getAll, getById, create, remove };
