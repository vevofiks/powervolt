const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const ApiError = require('../utils/ApiError');

class ServiceInvoiceService {
  async create(data) {
    const { customerId, customerName, accountId, items, invoiceNo, date, totalAmount, notes } = data;

    // Validate Account
    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) throw new ApiError(404, 'Receiving account not found');

    // Generate Invoice No if not provided
    let finalInvoiceNo = invoiceNo;
    if (!finalInvoiceNo) {
      const count = await prisma.serviceInvoice.count();
      finalInvoiceNo = `SV-${String(count + 1).padStart(4, '0')}`;
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
        items: {
          create: items.map(i => ({
            description: i.description,
            amount: parseFloat(i.amount),
          }))
        }
      },
      include: { items: true }
    });

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
}

module.exports = new ServiceInvoiceService();
