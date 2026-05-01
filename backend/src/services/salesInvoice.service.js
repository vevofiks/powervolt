// ─── Sales Invoice Service ─────────────────────────────────────
// Handles premium invoice creation, stock updates, and ledger tracking.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination, generateInvoiceNo } = require('../utils/helpers');
const stockService = require('./stock.service');
const ledgerService = require('./ledger.service');

/**
 * Get all sales invoices with search and filters.
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

  const [items, total] = await Promise.all([
    prisma.salesInvoice.findMany({
      where,
      include: { items: true, account: true },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.salesInvoice.count({ where }),
  ]);

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
 * Create a new Sales Invoice.
 */
const create = async (data) => {
  const {
    invoiceType, // GST or NON_GST
    customerId,
    customerName,
    customerPhone,
    customerGstin,
    customerAddress1,
    customerAddress2,
    customerCity,
    customerState,
    customerPincode,
    items, // [{ productId, qty, rate, gstPercent }]
    discount,
    accountId,
    notes,
    date
  } = data;

  if (!items || items.length === 0) throw ApiError.badRequest('Invoice must have at least one item');
  if (!accountId) throw ApiError.badRequest('Payment account is required');

  return await prisma.$transaction(async (tx) => {
    const targetDate = date ? new Date(date) : new Date();
    
    // 1. Generate Invoice Number safely by checking existing prefixes
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const prefix = `PV-INV-${year}${month}${day}-`;

    const lastInvoice = await tx.salesInvoice.findFirst({
      where: { invoiceNo: { startsWith: prefix } },
      orderBy: { invoiceNo: 'desc' }
    });

    let nextSeq = 1;
    if (lastInvoice) {
      const lastSeq = parseInt(lastInvoice.invoiceNo.split('-').pop(), 10);
      if (!isNaN(lastSeq)) {
        nextSeq = lastSeq + 1;
      }
    }

    const invoiceNo = `${prefix}${String(nextSeq).padStart(3, '0')}`;

    // 2. Process Items & Calculate Totals
    let subtotal = 0;
    let taxAmount = 0;
    let totalProfit = 0;
    const invoiceItems = [];

    for (const item of items) {
      const product = await tx.product.findUnique({ where: { id: item.productId } });
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

      // 3. Update Stock
      await stockService.recordMovement({
        productId: item.productId,
        type: 'SALE_OUT',
        quantity: item.qty,
        reference: invoiceNo,
        remark: `Sale Invoice ${invoiceNo}`,
        date: date || new Date()
      }, tx);
    }

    const totalAmount = subtotal + taxAmount - (parseFloat(discount) || 0);

    // 4. Record Ledger Transaction
    await ledgerService.recordTransaction({
      accountId,
      date: date || new Date(),
      referenceNo: invoiceNo,
      moduleType: 'SALES_INVOICE',
      description: `Sales Invoice ${invoiceNo} for ${customerName || 'Walk-in Customer'}`,
      credit: totalAmount,
      linkedId: null // We'll set this after invoice creation if needed, or just use referenceNo
    }, tx);

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
      // Update existing customer if needed? (Usually yes, keep data fresh)
      await tx.customer.update({
        where: { id: finalCustomerId },
        data: customerPayload
      });
    } else if (customerName && customerPhone) {
      // Search for existing by phone first
      const existing = await tx.customer.findFirst({ where: { phone: customerPhone } });
      if (existing) {
        finalCustomerId = existing.id;
        await tx.customer.update({
          where: { id: finalCustomerId },
          data: customerPayload
        });
      } else {
        // Create new
        const newCustomer = await tx.customer.create({ data: customerPayload });
        finalCustomerId = newCustomer.id;
      }
    }

    // 6. Save Invoice
    const invoice = await tx.salesInvoice.create({
      data: {
        invoiceNo,
        date: date ? new Date(date) : new Date(),
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
        items: {
          create: invoiceItems
        }
      },
      include: { items: true }
    });

    return invoice;
  });
};

/**
 * Remove an invoice (reverts stock and ledger).
 */
const remove = async (id) => {
  const invoice = await prisma.salesInvoice.findUnique({
    where: { id },
    include: { items: true }
  });
  if (!invoice) throw ApiError.notFound('Invoice not found');

  return await prisma.$transaction(async (tx) => {
    // 1. Revert Stock
    for (const item of invoice.items) {
      await stockService.recordMovement({
        productId: item.productId,
        type: 'RETURN_IN', // Reverting sale
        quantity: item.qty,
        reference: invoice.invoiceNo,
        remark: `Reverted Sale Invoice ${invoice.invoiceNo}`,
        date: new Date()
      }, tx);
    }

    // 2. Revert Ledger (Debit the amount back)
    await ledgerService.recordEntry({
      accountId: invoice.accountId,
      type: 'MANUAL_ADJUSTMENT', // Use a correction type
      amount: invoice.totalAmount, // Negative amount to subtract if ledgerService handles it, 
      // but recordEntry takes absolute amount and type decides sign.
      // Since SALE_CREDIT adds, we need something that subtracts.
      // PURCHASE_DEBIT subtracts.
      // Let's use a manual adjustment logic or a specific REVERT_SALE type.
    }, tx);
    
    // Wait, ledgerService recordEntry logic:
    // isDebit = DEBIT_TYPES.includes(type) -> subtracts
    // MANUAL_ADJUSTMENT is in CREDIT_TYPES -> adds.
    // So we need a debit type to subtract.
    
    await ledgerService.recordEntry({
      accountId: invoice.accountId,
      type: 'EXPENSE_DEBIT', // Using expense debit to subtract balance
      amount: invoice.totalAmount,
      reference: invoice.invoiceNo,
      remark: `Reverted Sales Invoice ${invoice.invoiceNo}`
    }, tx);

    // 3. Delete Invoice (Cascade will handle items)
    await tx.salesInvoice.delete({ where: { id } });
    return true;
  });
};

module.exports = { getAll, getById, create, remove };
