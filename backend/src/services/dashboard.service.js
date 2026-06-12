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

  // Overall financial stats for dashboard cards
  const [
    overallSales,
    overallExpenses,
    overallPurchases,
    overallWorkEntries,
    overallAllowances,
    overallDeductions,
    overallPayments
  ] = await Promise.all([
    prisma.salesInvoice.aggregate({ _sum: { totalAmount: true, taxAmount: true } }),
    prisma.expense.aggregate({ _sum: { amount: true, gstPaid: true } }),
    prisma.purchaseBill.aggregate({ _sum: { totalAmount: true, taxAmount: true } }),
    prisma.siteWorkEntry.aggregate({ _sum: { amount: true } }),
    prisma.workerAllowance.aggregate({ _sum: { amount: true } }),
    prisma.workerDeduction.aggregate({ _sum: { amount: true } }),
    prisma.salaryPayment.aggregate({ _sum: { amount: true } })
  ]);

  const totalRevenue = overallSales._sum.totalAmount || 0;
  const directExpenseSum = overallExpenses._sum.amount || 0;
  const purchaseBillSum = overallPurchases._sum.totalAmount || 0;
  const totalExpenses = directExpenseSum + purchaseBillSum;
  const netProfit = totalRevenue - totalExpenses;

  const totalWorkAmount = overallWorkEntries._sum.amount || 0;
  const totalAllowances = overallAllowances._sum.amount || 0;
  const totalDeductions = overallDeductions._sum.amount || 0;
  const salaryPaid = overallPayments._sum.amount || 0;
  
  // Pending salary payable = (Calculated earnings + Allowances) - Deductions - Salary Paid
  const salaryPayable = (totalWorkAmount + totalAllowances) - totalDeductions - salaryPaid;

  const gstCollected = overallSales._sum.taxAmount || 0;
  const gstPaidOnPurchases = overallPurchases._sum.taxAmount || 0;
  const gstPaidOnExpenses = overallExpenses._sum.gstPaid || 0;
  const gstPaid = gstPaidOnPurchases + gstPaidOnExpenses;

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
      
      // New dashboard metrics
      totalRevenue,
      totalExpenses,
      netProfit,
      salaryPayable,
      salaryPaid,
      gstCollected,
      gstPaid
    },
    recentSales,
    recentExpenses,
    accountBalances
  };
};

module.exports = { getStats };
