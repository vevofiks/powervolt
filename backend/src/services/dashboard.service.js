const prisma = require('../models/prisma');

const getStats = async () => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    salesCount,
    salesAmount,
    productSalesCount,
    productSalesAmount,
    serviceSalesCount,
    serviceSalesAmount,
    expenseAmount,
    stockValue,
    recentSales,
    recentExpenses,
    accountBalances
  ] = await Promise.all([
    // All sales this month
    prisma.salesInvoice.count({ where: { date: { gte: startOfMonth } } }),
    prisma.salesInvoice.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { totalAmount: true }
    }),
    // Product invoices this month
    prisma.salesInvoice.count({ where: { date: { gte: startOfMonth }, invoiceCategory: 'PRODUCT' } }),
    prisma.salesInvoice.aggregate({
      where: { date: { gte: startOfMonth }, invoiceCategory: 'PRODUCT' },
      _sum: { totalAmount: true }
    }),
    // Service invoices this month
    prisma.salesInvoice.count({ where: { date: { gte: startOfMonth }, invoiceCategory: 'SERVICE' } }),
    prisma.salesInvoice.aggregate({
      where: { date: { gte: startOfMonth }, invoiceCategory: 'SERVICE' },
      _sum: { totalAmount: true }
    }),
    // Expenses this month
    prisma.expense.aggregate({
      where: { date: { gte: startOfMonth } },
      _sum: { amount: true }
    }),
    // Total Stock Value (qty * purchasePrice)
    prisma.product.findMany({
      select: { currentStock: true, purchasePrice: true }
    }),
    // Recent Sales (include category)
    prisma.salesInvoice.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      select: { invoiceNo: true, customerName: true, totalAmount: true, date: true, invoiceCategory: true }
    }),
    // Recent Expenses
    prisma.expense.findMany({
      take: 5,
      orderBy: { date: 'desc' },
      select: { category: true, payee: true, amount: true, date: true }
    }),
    // Account Balances
    prisma.account.findMany({
      select: { accountName: true, currentBalance: true }
    })
  ]);

  // Calculate stock value manually since it's a derived field
  const totalStockValue = stockValue.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);

  return {
    summary: {
      monthlySales: salesAmount._sum.totalAmount || 0,
      monthlyExpenses: expenseAmount._sum.amount || 0,
      totalStockValue,
      salesCount,
      productSalesCount,
      productSalesRevenue: productSalesAmount._sum.totalAmount || 0,
      serviceSalesCount,
      serviceSalesRevenue: serviceSalesAmount._sum.totalAmount || 0,
    },
    recentSales,
    recentExpenses,
    accountBalances
  };
};

module.exports = { getStats };
