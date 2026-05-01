const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');

const get = async () => {
  let settings = await prisma.setting.findFirst();
  if (!settings) {
    settings = await prisma.setting.create({
      data: { companyName: 'Power Volt' }
    });
  }
  return settings;
};

const update = async (data) => {
  const current = await get();
  return await prisma.setting.update({
    where: { id: current.id },
    data
  });
};

const exportBackup = async () => {
  const [
    accounts, products, customers, suppliers, 
    sales, purchases, expenses, workSites, 
    staff, salaries, settings
  ] = await Promise.all([
    prisma.account.findMany(),
    prisma.product.findMany(),
    prisma.customer.findMany(),
    prisma.supplier.findMany(),
    prisma.salesInvoice.findMany({ include: { items: true } }),
    prisma.purchaseInvoice.findMany({ include: { items: true } }),
    prisma.expense.findMany(),
    prisma.workSite.findMany({ include: { staff: true, workEntries: true } }),
    prisma.staff.findMany({ include: { attendances: true, adjustments: true } }),
    prisma.salary.findMany(),
    prisma.setting.findMany()
  ]);

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    data: {
      accounts, products, customers, suppliers,
      sales, purchases, expenses, workSites,
      staff, salaries, settings
    }
  };
};

module.exports = { get, update, exportBackup };
