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

  const [sales, productSales, serviceSales, purchases, expenses, productItems, purchaseBillItems] = await Promise.all([
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
    }),
    // Product sales items for detailed COGS calculation
    prisma.salesInvoiceItem.findMany({
      where: {
        itemType: 'PRODUCT',
        invoice: where.date ? { date: where.date } : {}
      }
    }),
    // Purchase bill items for detailed product calculations
    prisma.purchaseBillItem.findMany({
      where: {
        bill: where.date ? { date: where.date } : {}
      }
    })
  ]);

  const productRevenue = productSales._sum.totalAmount || 0;
  const serviceRevenue = serviceSales._sum.totalAmount || 0;
  const totalRevenue = productRevenue + serviceRevenue;

  const purchaseBillCost = purchases._sum.totalAmount || 0;

  // Let's calculate product COGS and direct profitability
  const productRevenueFromItems = productItems.reduce((sum, item) => sum + (item.amount || 0), 0);
  const productCOGS = productItems.reduce((sum, item) => sum + ((item.qty || 0) * (item.purchasePrice || 0)), 0);
  const productGrossProfit = productRevenueFromItems - productCOGS;

  // Let's calculate detailed product-by-product breakdown
  const productStats = {};

  productItems.forEach(item => {
    const key = item.productId || item.productName;
    if (!productStats[key]) {
      productStats[key] = {
        productId: item.productId,
        productName: item.productName,
        purchasedQty: 0,
        purchasedAmount: 0,
        soldQty: 0,
        soldAmount: 0,
        cogs: 0,
        profit: 0
      };
    }
    productStats[key].soldQty += item.qty || 0;
    productStats[key].soldAmount += item.amount || 0;
    productStats[key].cogs += (item.qty || 0) * (item.purchasePrice || 0);
  });

  purchaseBillItems.forEach(item => {
    const key = item.productId || item.productName;
    if (!productStats[key]) {
      productStats[key] = {
        productId: item.productId,
        productName: item.productName,
        purchasedQty: 0,
        purchasedAmount: 0,
        soldQty: 0,
        soldAmount: 0,
        cogs: 0,
        profit: 0
      };
    }
    productStats[key].purchasedQty += item.qty || 0;
    productStats[key].purchasedAmount += item.amount || 0;
  });

  const productBreakdown = Object.values(productStats).map(p => {
    p.profit = p.soldAmount - p.cogs;
    p.margin = p.soldAmount > 0 ? (p.profit / p.soldAmount) * 100 : 0;
    return p;
  });

  // Let's categorize the expenses
  let salaryPaid = 0;
  let purchaseExpenses = purchaseBillCost; // starts with inventory purchase bills
  let siteExpenses = 0;
  let operationalExpenses = 0;
  let travelExpenses = 0;
  let foodExpenses = 0;
  let otherExpenses = 0;
  let directProductExpenses = 0; // Carriage, material purchases, etc.

  expenses.forEach(exp => {
    const cat = exp.category;
    const amt = exp.amount || 0;
    
    if (cat === 'SALARY_PAYMENT') {
      salaryPaid += amt;
    } else if (cat === 'PURCHASE_EXPENSE' || cat === 'MATERIALS') {
      purchaseExpenses += amt;
      directProductExpenses += amt;
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

    // Product specific P&L
    productPnL: {
      revenue: productRevenueFromItems,
      cogs: productCOGS,
      grossProfit: productGrossProfit,
      directExpenses: directProductExpenses,
      purchases: purchaseBillCost,
      netProfit: productGrossProfit - directProductExpenses,
      productBreakdown
    },

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
