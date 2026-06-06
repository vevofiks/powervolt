const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ApiError = require('../utils/ApiError');

class PurchaseBillService {
  async createBill(data) {
    const { vendorId, accountId, items, billNo, date, billType, subtotal, discount, taxAmount, totalAmount, notes, terms, paymentStatus } = data;

    // 1. Get vendor details if provided
    let vendorName = '';
    let vendorPhone = '';
    let vendorGstNumber = '';

    if (vendorId) {
      const vendor = await prisma.vendor.findUnique({ where: { id: vendorId } });
      if (vendor) {
        vendorName = vendor.name;
        vendorPhone = vendor.phone;
        vendorGstNumber = vendor.gstNumber;
      }
    }

    // 2. Validate Account
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) {
      throw new ApiError(404, 'Paying account not found');
    }

    // Generate Bill No format Pv-bill-YYYY/SEQ if not provided or if it's the auto-generated PB- one from frontend
    let finalBillNo = billNo;
    if (!finalBillNo || finalBillNo.startsWith('PB-')) {
      const year = (date ? new Date(date) : new Date()).getFullYear();
      const prefix = `Pv-bill-${year}/`;

      const lastBill = await prisma.purchaseBill.findFirst({
        where: { billNo: { startsWith: prefix } },
        orderBy: { billNo: 'desc' }
      });

      let nextSeq = 14;
      if (lastBill) {
        const lastSeq = parseInt(lastBill.billNo.split('/').pop(), 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }

      finalBillNo = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    }

    // 3. Create the PurchaseBill and Items in a single nested write
    const bill = await prisma.purchaseBill.create({
      data: {
        billNo: finalBillNo,
        date: date ? new Date(date) : new Date(),
        billType: billType || 'NON_GST',
        vendorId,
        vendorName,
        vendorPhone,
        vendorGstNumber,
        accountId,
        subtotal: parseFloat(subtotal) || 0,
        discount: parseFloat(discount) || 0,
        taxAmount: parseFloat(taxAmount) || 0,
        totalAmount: parseFloat(totalAmount) || 0,
        notes,
        terms,
        paymentStatus: paymentStatus || 'PAID',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            productName: item.productName,
            sku: item.sku,
            hsnCode: item.hsnCode,
            qty: parseFloat(item.qty),
            purchasePrice: parseFloat(item.purchasePrice),
            salePrice: parseFloat(item.salePrice),
            amount: parseFloat(item.amount),
          })),
        },
      },
      include: {
        items: true,
      },
    });

    // 4 & 5. Update Paying Account Balance and Create Ledger Transaction ONLY if PAID
    const finalPaymentStatus = paymentStatus || 'PAID';
    if (finalPaymentStatus === 'PAID') {
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: {
          currentBalance: {
            decrement: bill.totalAmount,
          },
        },
      });

      await prisma.ledgerTransaction.create({
        data: {
          accountId,
          date: bill.date,
          referenceNo: bill.billNo,
          moduleType: 'PURCHASE_BILL',
          description: `Purchase Bill ${vendorName ? 'from ' + vendorName : ''}`,
          credit: 0,
          debit: bill.totalAmount, // Money out
          balanceAfter: updatedAccount.currentBalance,
          linkedId: bill.id,
        },
      });
    }

    // 6. Update Product Stocks and Stock History sequentially
    for (const item of bill.items) {
      // Find current product to know currentStock for history
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        // Update product stock and pricing
        const updatedProduct = await prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              increment: item.qty,
            },
            purchasePrice: item.purchasePrice,
            salePrice: item.salePrice,
            hsnCode: item.hsnCode,
            sku: item.sku,
          },
        });

        // Add to Stock History
        await prisma.stockHistory.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE_IN',
            quantity: item.qty,
            stockAfter: updatedProduct.currentStock,
            reference: bill.billNo,
            remark: `Purchased via Bill No: ${bill.billNo}`,
            date: bill.date,
          },
        });
      }
    }

    return bill;
  }

  async getAllBills(searchTerm) {
    const where = searchTerm
      ? {
          OR: [
            { billNo: { contains: searchTerm, mode: 'insensitive' } },
            { vendorName: { contains: searchTerm, mode: 'insensitive' } },
          ],
        }
      : {};

    return prisma.purchaseBill.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        vendor: true,
      },
    });
  }

  async getBillById(id) {
    const bill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: {
        items: true,
        account: true,
        vendor: true,
      },
    });
    if (!bill) {
      throw new ApiError(404, 'Purchase Bill not found');
    }
    return bill;
  }

  async updatePaymentStatus(id, status) {
    const bill = await prisma.purchaseBill.findUnique({ where: { id } });
    if (!bill) throw new ApiError(404, 'Purchase Bill not found');
    
    if (bill.paymentStatus === status) return bill;

    const updatedBill = await prisma.purchaseBill.update({
      where: { id },
      data: { paymentStatus: status }
    });

    if (status === 'PAID' && bill.paymentStatus === 'PENDING') {
      const updatedAccount = await prisma.account.update({
        where: { id: bill.accountId },
        data: { currentBalance: { decrement: bill.totalAmount } },
      });
      await prisma.ledgerTransaction.create({
        data: {
          accountId: bill.accountId,
          date: new Date(),
          referenceNo: bill.billNo,
          moduleType: 'PURCHASE_BILL',
          description: `Purchase Bill ${bill.vendorName ? 'from ' + bill.vendorName : ''} (Marked Paid)`,
          credit: 0,
          debit: bill.totalAmount,
          balanceAfter: updatedAccount.currentBalance,
          linkedId: bill.id,
        },
      });
    } else if (status === 'PENDING' && bill.paymentStatus === 'PAID') {
      const updatedAccount = await prisma.account.update({
        where: { id: bill.accountId },
        data: { currentBalance: { increment: bill.totalAmount } },
      });
      await prisma.ledgerTransaction.create({
        data: {
          accountId: bill.accountId,
          date: new Date(),
          referenceNo: `REV-${bill.billNo}`,
          moduleType: 'ADJUSTMENT',
          description: `Purchase Bill ${bill.vendorName ? 'from ' + bill.vendorName : ''} (Marked Pending)`,
          credit: bill.totalAmount,
          debit: 0,
          balanceAfter: updatedAccount.currentBalance,
          linkedId: bill.id,
        },
      });
    }

    return updatedBill;
  }
}

module.exports = new PurchaseBillService();
