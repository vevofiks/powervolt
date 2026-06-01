const prisma = require('../models/prisma');

/**
 * Get Profit & Loss Summary for a date range.
 */
const getProfitLoss = async (startDate, endDate) => {
  const where = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [sales, productSales, serviceSales, purchases, expenses, salaries] = await Promise.all([
    // Total Revenue & Total Direct Profit
    prisma.salesInvoice.aggregate({
      where,
      _sum: { totalAmount: true, profit: true },
      _count: { id: true }
    }),
    // Product invoice stats
    prisma.salesInvoice.aggregate({
      where: { ...where, invoiceCategory: 'PRODUCT' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    // Service invoice stats
    prisma.salesInvoice.aggregate({
      where: { ...where, invoiceCategory: 'SERVICE' },
      _sum: { totalAmount: true },
      _count: { id: true }
    }),
    // Total Purchases (Expense for inventory)
    prisma.purchaseInvoice.aggregate({
      where,
      _sum: { totalAmount: true }
    }),
    // Operating Expenses
    prisma.expense.aggregate({
      where,
      _sum: { amount: true }
    }),
    // Payroll
    prisma.salaryPayment.aggregate({
      where,
      _sum: { amount: true }
    })
  ]);

  const revenue = sales._sum.totalAmount || 0;
  const grossProfit = sales._sum.profit || 0;
  const purchaseCost = purchases._sum.totalAmount || 0;
  const operationalExpenses = (expenses._sum.amount || 0) + (salaries._sum.amount || 0);
  const netProfit = grossProfit - operationalExpenses;

  return {
    revenue,
    grossProfit,
    purchaseCost,
    operationalExpenses,
    netProfit,
    totalInvoiceCount: sales._count.id || 0,
    categoryStats: {
      product: {
        count: productSales._count.id || 0,
        revenue: productSales._sum.totalAmount || 0
      },
      service: {
        count: serviceSales._count.id || 0,
        revenue: serviceSales._sum.totalAmount || 0
      }
    },
    expenseBreakdown: {
      materials: expenses._sum.amount || 0, // Simplified for now
      salaries: salaries._sum.amount || 0
    }
  };
};

/**
 * Get Inventory Report (Stock Value & Low Stock).
 */
const getInventoryReport = async () => {
  const products = await prisma.product.findMany({
    select: {
      productName: true,
      category: true,
      currentStock: true,
      purchasePrice: true,
      salePrice: true,
      unit: true
    }
  });

  const totalValue = products.reduce((acc, p) => acc + (p.currentStock * p.purchasePrice), 0);
  const potentialRevenue = products.reduce((acc, p) => acc + (p.currentStock * p.salePrice), 0);

  return {
    products,
    totalValue,
    potentialRevenue,
    totalItems: products.length
  };
};

module.exports = { getProfitLoss, getInventoryReport };
