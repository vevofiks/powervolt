const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ApiError = require('../utils/ApiError');

class ServiceInvoiceService {
  async create(data) {
    const { customerId, customerName, accountId, items, invoiceNo, date, totalAmount, notes, paymentStatus } = data;

    // Validate Account
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new ApiError(404, 'Receiving account not found');

    // Generate Invoice No if not provided
    let finalInvoiceNo = invoiceNo;
    if (!finalInvoiceNo) {
      const year = (date ? new Date(date) : new Date()).getFullYear();
      const prefix = `PV-INV-${year}/`;

      const lastInvoice = await prisma.serviceInvoice.findFirst({
        where: { invoiceNo: { startsWith: prefix } },
        orderBy: { invoiceNo: 'desc' }
      });

      let nextSeq = 14;
      if (lastInvoice) {
        const lastSeq = parseInt(lastInvoice.invoiceNo.split('/').pop(), 10);
        if (!isNaN(lastSeq)) nextSeq = lastSeq + 1;
      }

      finalInvoiceNo = `${prefix}${String(nextSeq).padStart(3, '0')}`;
    }

    const invoice = await prisma.serviceInvoice.create({
      data: {
        invoiceNo: finalInvoiceNo,
        date: date ? new Date(date) : new Date(),
        customerId: customerId || null,
        customerName,
        accountId,
        totalAmount: parseFloat(totalAmount) || 0,
        notes,
        paymentStatus: paymentStatus || 'PENDING',
        items: {
          create: items.map(i => ({
            description: i.description,
            qty: i.qty !== undefined && i.qty !== null && i.qty !== '' ? parseFloat(i.qty) : null,
            rate: i.rate !== undefined && i.rate !== null && i.rate !== '' ? parseFloat(i.rate) : null,
            amount: parseFloat(i.amount),
          }))
        }
      },
      include: { items: true }
    });

    if ((paymentStatus || 'PENDING') === 'PAID') {
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: invoice.totalAmount } }
      });

      await prisma.ledgerTransaction.create({
        data: {
          accountId,
          date: invoice.date,
          referenceNo: invoice.invoiceNo,
          moduleType: 'SALES_INVOICE',
          description: `Service Invoice ${customerName ? 'to ' + customerName : ''}`,
          credit: invoice.totalAmount,
          debit: 0,
          balanceAfter: updatedAccount.currentBalance,
          linkedId: invoice.id,
        }
      });
    }

    return invoice;
  }

  async getAll() {
    return prisma.serviceInvoice.findMany({
      orderBy: { date: 'desc' },
      include: { customer: true }
    });
  }

  async getById(id) {
    const invoice = await prisma.serviceInvoice.findUnique({
      where: { id },
      include: { items: true, account: true, customer: true }
    });
    if (!invoice) throw new ApiError(404, 'Service Invoice not found');
    return invoice;
  }

  async updatePaymentStatus(id, status) {
    const invoice = await prisma.serviceInvoice.findUnique({ where: { id } });
    if (!invoice) throw new ApiError(404, 'Service Invoice not found');
    
    if (invoice.paymentStatus === status) return invoice;

    const updated = await prisma.serviceInvoice.update({
      where: { id },
      data: { paymentStatus: status }
    });

    if (status === 'PAID' && invoice.paymentStatus === 'PENDING') {
      const updatedAccount = await prisma.account.update({
        where: { id: invoice.accountId },
        data: { currentBalance: { increment: invoice.totalAmount } }
      });
      await prisma.ledgerTransaction.create({
        data: {
          accountId: invoice.accountId,
          date: new Date(),
          referenceNo: invoice.invoiceNo,
          moduleType: 'SALES_INVOICE',
          description: `Service Invoice ${invoice.customerName ? 'to ' + invoice.customerName : ''} (Marked Paid)`,
          credit: invoice.totalAmount,
          debit: 0,
          balanceAfter: updatedAccount.currentBalance,
          linkedId: invoice.id,
        }
      });
    } else if (status === 'PENDING' && invoice.paymentStatus === 'PAID') {
      const updatedAccount = await prisma.account.update({
        where: { id: invoice.accountId },
        data: { currentBalance: { decrement: invoice.totalAmount } }
      });
      await prisma.ledgerTransaction.create({
        data: {
          accountId: invoice.accountId,
          date: new Date(),
          referenceNo: `REV-${invoice.invoiceNo}`,
          moduleType: 'ADJUSTMENT',
          description: `Service Invoice ${invoice.customerName ? 'to ' + invoice.customerName : ''} (Marked Pending)`,
          credit: 0,
          debit: invoice.totalAmount,
          balanceAfter: updatedAccount.currentBalance,
          linkedId: invoice.id,
        }
      });
    }

    return updated;
  }

  async remove(id) {
    const invoice = await prisma.serviceInvoice.findUnique({ where: { id } });
    if (!invoice) throw new ApiError(404, 'Service Invoice not found');

    if (invoice.paymentStatus === 'PAID') {
      await prisma.account.update({
        where: { id: invoice.accountId },
        data: { currentBalance: { decrement: invoice.totalAmount } }
      });
    }

    await prisma.ledgerTransaction.deleteMany({
      where: { linkedId: invoice.id }
    });

    await prisma.serviceInvoice.delete({ where: { id } });
    return true;
  }

  async update(id, data) {
    const originalInvoice = await prisma.serviceInvoice.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!originalInvoice) throw new ApiError(404, 'Service Invoice not found');

    const { customerId, customerName, accountId, items, invoiceNo, date, totalAmount, notes, paymentStatus } = data;

    // Validate Account
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new ApiError(404, 'Receiving account not found');

    // 1. Revert original Paying Account Balance if it was PAID
    if (originalInvoice.paymentStatus === 'PAID') {
      const originalAccount = await prisma.account.findUnique({ where: { id: originalInvoice.accountId } });
      if (originalAccount) {
        await prisma.account.update({
          where: { id: originalInvoice.accountId },
          data: { currentBalance: { decrement: originalInvoice.totalAmount } }
        });
      }

      await prisma.ledgerTransaction.deleteMany({
        where: { linkedId: originalInvoice.id }
      });
    }

    // 2. Delete original items
    await prisma.serviceInvoiceItem.deleteMany({
      where: { serviceInvoiceId: id }
    });

    // 3. Update Service Invoice and recreate items
    const invoice = await prisma.serviceInvoice.update({
      where: { id },
      data: {
        date: date ? new Date(date) : originalInvoice.date,
        customerId: customerId || null,
        customerName,
        accountId,
        totalAmount: parseFloat(totalAmount) || 0,
        notes,
        paymentStatus: paymentStatus || 'PENDING',
        items: {
          create: items.map(i => ({
            description: i.description,
            qty: i.qty !== undefined && i.qty !== null && i.qty !== '' ? parseFloat(i.qty) : null,
            rate: i.rate !== undefined && i.rate !== null && i.rate !== '' ? parseFloat(i.rate) : null,
            amount: parseFloat(i.amount),
          }))
        }
      },
      include: { items: true }
    });

    // 4. Update Paying Account Balance & Ledger Transaction if new status is PAID
    if ((paymentStatus || 'PENDING') === 'PAID') {
      const updatedAccount = await prisma.account.update({
        where: { id: accountId },
        data: { currentBalance: { increment: invoice.totalAmount } }
      });

      await prisma.ledgerTransaction.create({
        data: {
          accountId,
          date: invoice.date,
          referenceNo: invoice.invoiceNo,
          moduleType: 'SALES_INVOICE',
          description: `Service Invoice ${customerName ? 'to ' + customerName : ''} (Edited)`,
          credit: invoice.totalAmount,
          debit: 0,
          balanceAfter: updatedAccount.currentBalance,
          linkedId: invoice.id,
        }
      });
    }

    return invoice;
  }
}

module.exports = new ServiceInvoiceService();
