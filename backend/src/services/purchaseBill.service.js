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
      const prefix = `PV-BILL-${year}/`;

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

  async deleteBill(id) {
    const bill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!bill) {
      throw new ApiError(404, 'Purchase Bill not found');
    }

    // 1. Revert Paying Account Balance and Ledger Transaction if PAID
    if (bill.paymentStatus === 'PAID') {
      const account = await prisma.account.findUnique({ where: { id: bill.accountId } });
      if (account) {
        await prisma.account.update({
          where: { id: bill.accountId },
          data: {
            currentBalance: {
              increment: bill.totalAmount,
            },
          },
        });
      }

      await prisma.ledgerTransaction.deleteMany({
        where: {
          OR: [
            { linkedId: bill.id },
            { referenceNo: bill.billNo, moduleType: 'PURCHASE_BILL' },
          ]
        },
      });
    }

    // 2. Revert Product Stocks and Stock History
    for (const item of bill.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.qty,
            },
          },
        });

        await prisma.stockHistory.deleteMany({
          where: {
            reference: bill.billNo,
            productId: item.productId,
          },
        });
      }
    }

    // 3. Delete the PurchaseBill itself
    await prisma.purchaseBill.delete({
      where: { id },
    });

    return true;
  }

  async updateBill(id, data) {
    const originalBill = await prisma.purchaseBill.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!originalBill) {
      throw new ApiError(404, 'Purchase Bill not found');
    }

    const { vendorId, accountId, items, billNo, date, billType, subtotal, discount, taxAmount, totalAmount, notes, terms, paymentStatus } = data;

    // 1. Revert original Paying Account Balance and delete original Ledger Transaction ONLY if original was PAID
    if (originalBill.paymentStatus === 'PAID') {
      const originalAccount = await prisma.account.findUnique({ where: { id: originalBill.accountId } });
      if (originalAccount) {
        await prisma.account.update({
          where: { id: originalBill.accountId },
          data: {
            currentBalance: {
              increment: originalBill.totalAmount,
            },
          },
        });
      }

      await prisma.ledgerTransaction.deleteMany({
        where: {
          OR: [
            { linkedId: originalBill.id },
            { referenceNo: originalBill.billNo, moduleType: 'PURCHASE_BILL' },
          ]
        },
      });
    }

    // 2. Revert Stock for original items
    for (const item of originalBill.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
        await prisma.product.update({
          where: { id: item.productId },
          data: {
            currentStock: {
              decrement: item.qty,
            },
          },
        });

        await prisma.stockHistory.deleteMany({
          where: {
            reference: originalBill.billNo,
            productId: item.productId,
          },
        });
      }
    }

    // 3. Delete original items
    await prisma.purchaseBillItem.deleteMany({
      where: { billId: id },
    });

    // 4. Resolve vendor details
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

    // 5. Update the PurchaseBill itself (with new values, recreating items)
    const bill = await prisma.purchaseBill.update({
      where: { id },
      data: {
        date: date ? new Date(date) : originalBill.date,
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

    // 6. Update Paying Account Balance and Create Ledger Transaction ONLY if new status is PAID
    if (bill.paymentStatus === 'PAID') {
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
          description: `Purchase Bill ${vendorName ? 'from ' + vendorName : ''} (Edited)`,
          credit: 0,
          debit: bill.totalAmount, // Money out
          balanceAfter: updatedAccount.currentBalance,
          linkedId: bill.id,
        },
      });
    }

    // 7. Update Product Stocks and Stock History sequentially for new items
    for (const item of bill.items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (product) {
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

        await prisma.stockHistory.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE_IN',
            quantity: item.qty,
            stockAfter: updatedProduct.currentStock,
            reference: bill.billNo,
            remark: `Purchased via Bill No: ${bill.billNo} (Edited)`,
            date: bill.date,
          },
        });
      }
    }

    return bill;
  }
}

module.exports = new PurchaseBillService();
