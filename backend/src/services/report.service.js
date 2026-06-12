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

  const [sales, productSales, serviceSales, purchases, expenses] = await Promise.all([
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
    prisma.purchaseBill.aggregate({
      where,
      _sum: { totalAmount: true }
    }),
    // Operating Expenses
    prisma.expense.findMany({
      where,
      select: { category: true, amount: true }
    })
  ]);

  const productRevenue = productSales._sum.totalAmount || 0;
  const serviceRevenue = serviceSales._sum.totalAmount || 0;
  const totalRevenue = productRevenue + serviceRevenue;

  const purchaseBillCost = purchases._sum.totalAmount || 0;

  // Let's categorize the expenses
  let salaryPaid = 0;
  let purchaseExpenses = purchaseBillCost; // starts with inventory purchase bills
  let siteExpenses = 0;
  let operationalExpenses = 0;
  let travelExpenses = 0;
  let foodExpenses = 0;
  let otherExpenses = 0;

  expenses.forEach(exp => {
    const cat = exp.category;
    const amt = exp.amount || 0;
    
    if (cat === 'SALARY_PAYMENT') {
      salaryPaid += amt;
    } else if (cat === 'PURCHASE_EXPENSE' || cat === 'MATERIALS') {
      purchaseExpenses += amt;
    } else if (cat === 'SITE_EXPENSE') {
      siteExpenses += amt;
    } else if (cat === 'TRAVEL_EXPENSE' || cat === 'FUEL' || cat === 'TRAVEL') {
      travelExpenses += amt;
    } else if (cat === 'FOOD_EXPENSE' || cat === 'FOOD') {
      foodExpenses += amt;
    } else if (cat === 'OFFICE_EXPENSE' || cat === 'UTILITY_EXPENSE' || cat === 'OFFICE' || cat === 'UTILITY') {
      operationalExpenses += amt;
    } else {
      otherExpenses += amt;
    }
  });

  const totalExpenses = salaryPaid + purchaseExpenses + siteExpenses + operationalExpenses + travelExpenses + foodExpenses + otherExpenses;
  const netProfit = totalRevenue - totalExpenses;

  return {
    revenue: totalRevenue,
    productSales: productRevenue,
    serviceSales: serviceRevenue,
    
    // Detailed expenses
    salaryPaid,
    purchaseExpenses,
    siteExpenses,
    operationalExpenses,
    travelExpenses,
    foodExpenses,
    otherExpenses,

    totalExpenses,
    netProfit,

    // Keep some original fields for dashboard/other modules compatibility
    grossProfit: totalRevenue - purchaseExpenses,
    purchaseCost: purchaseExpenses,
    totalInvoiceCount: sales._count.id || 0,
    categoryStats: {
      product: {
        count: productSales._count.id || 0,
        revenue: productRevenue
      },
      service: {
        count: serviceSales._count.id || 0,
        revenue: serviceRevenue
      }
    },
    expenseBreakdown: {
      salaries: salaryPaid,
      other: totalExpenses - salaryPaid
    }
  };
};

/**
 * Get GST Summary report.
 */
const getGstReport = async (startDate, endDate) => {
  const where = {};
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [salesGst, purchaseGst, expenseGst] = await Promise.all([
    // GST Collected from Sales
    prisma.salesInvoice.aggregate({
      where,
      _sum: { taxAmount: true }
    }),
    // GST Paid on Purchase Bills
    prisma.purchaseBill.aggregate({
      where,
      _sum: { taxAmount: true }
    }),
    // GST Paid on Expenses
    prisma.expense.aggregate({
      where,
      _sum: { gstPaid: true }
    })
  ]);

  const totalGstCollected = salesGst._sum.taxAmount || 0;
  const gstPaidOnPurchases = purchaseGst._sum.taxAmount || 0;
  const gstPaidOnExpenses = expenseGst._sum.gstPaid || 0;
  const totalGstPaid = gstPaidOnPurchases + gstPaidOnExpenses;
  const netGstPosition = totalGstCollected - totalGstPaid;

  return {
    totalGstCollected,
    gstPaidOnPurchases,
    gstPaidOnExpenses,
    totalGstPaid,
    netGstPosition
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

module.exports = { getProfitLoss, getInventoryReport, getGstReport };
