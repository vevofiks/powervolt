const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');

const handleCustomerLink = async (tx, customerId, customerName, phone) => {
  if (customerId) return customerId;
  if (!customerName) return null;
  
  const existing = await tx.customer.findFirst({ where: { name: customerName } });
  if (existing) return existing.id;
  
  const newCust = await tx.customer.create({ data: { name: customerName, phone: phone || null } });
  return newCust.id;
};

const getAll = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { location: { contains: query.search, mode: 'insensitive' } },
      { customer: { name: { contains: query.search, mode: 'insensitive' } } }
    ];
  }
  if (query.status) where.status = query.status;

  const [items, total] = await Promise.all([
    prisma.workSite.findMany({
      where,
      include: {
        customer: { select: { name: true, phone: true } },
        _count: {
          select: { expenses: true, workers: true, workEntries: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.workSite.count({ where }),
  ]);

  return { items, pagination: buildPagination(total, page, limit) };
};

const getById = async (id) => {
  const site = await prisma.workSite.findUnique({
    where: { id },
    include: {
      customer: true,
      expenses: {
        include: { account: { select: { accountName: true } } },
        orderBy: { date: 'desc' },
        take: 20
      },
      workers: {
        include: { worker: true }
      },
      workEntries: {
        include: { worker: { select: { name: true, role: true } } },
        orderBy: { date: 'desc' },
        take: 50
      }
    }
  });
  if (!site) throw ApiError.notFound('Work Site not found');

  const totalExpenses = site.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalLaborCost = site.workEntries.reduce((sum, e) => sum + e.amount, 0);
  
  return { ...site, stats: { totalExpenses, totalLaborCost, totalSiteCost: totalExpenses + totalLaborCost } };
};

const create = async (data) => {
  return await prisma.$transaction(async (tx) => {
    const customerId = await handleCustomerLink(tx, data.customerId, data.customerName, data.customerPhone);
    return await tx.workSite.create({
      data: {
        name: data.name,
        customerId,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status || 'PENDING',
        budget: parseFloat(data.budget) || 0,
        notes: data.notes
      }
    });
  });
};

const update = async (id, data) => {
  return await prisma.$transaction(async (tx) => {
    const customerId = await handleCustomerLink(tx, data.customerId, data.customerName, data.customerPhone);
    return await tx.workSite.update({
      where: { id },
      data: {
        name: data.name,
        customerId,
        location: data.location,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        status: data.status,
        budget: data.budget !== undefined ? parseFloat(data.budget) : undefined,
        notes: data.notes
      }
    });
  });
};

const remove = async (id) => {
  const expensesCount = await prisma.expense.count({ where: { workSiteId: id } });
  if (expensesCount > 0) {
    throw ApiError.badRequest('Cannot delete work site with recorded expenses. Deactivate it instead.');
  }
  await prisma.workSite.delete({ where: { id } });
  return true;
};

const assignWorkers = async (siteId, workerIds) => {
  const data = workerIds.map(id => ({ workSiteId: siteId, workerId: id }));
  return await prisma.siteWorker.createMany({
    data,
    skipDuplicates: true
  });
};

const removeWorker = async (siteId, workerId) => {
  return await prisma.siteWorker.delete({
    where: { workSiteId_workerId: { workSiteId: siteId, workerId } }
  });
};

const addWorkEntry = async (data) => {
  return await prisma.siteWorkEntry.create({
    data: {
      workSiteId: data.workSiteId,
      workerId: data.workerId,
      date: data.date ? new Date(data.date) : new Date(),
      workType: data.workType, // FULL_DAY, HALF_DAY, OVERTIME
      hours: data.hours ? parseFloat(data.hours) : null,
      rate: parseFloat(data.rate),
      amount: parseFloat(data.amount),
      notes: data.notes
    }
  });
};

const deleteWorkEntry = async (id) => {
  return await prisma.siteWorkEntry.delete({ where: { id } });
};

module.exports = { 
  getAll, getById, create, update, remove, 
  assignWorkers, removeWorker, addWorkEntry, deleteWorkEntry 
};
