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

/**
 * Normalize a date string or object to UTC midnight (00:00:00.000Z)
 */
const normalizeDate = (d) => {
  const dateStr = d ? (typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0]) : new Date().toISOString().split('T')[0];
  return new Date(dateStr + "T00:00:00.000Z");
};

const addWorkEntry = async (data) => {
  const startOfDay = normalizeDate(data.date);
  const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);
  const today = normalizeDate(new Date());

  if (startOfDay > today) {
    throw ApiError.badRequest('Cannot mark attendance for a future date');
  }

  return await prisma.$transaction(async (tx) => {
    // 0. Check if entry already exists for this worker on this day
    const existing = await tx.siteWorkEntry.findFirst({
      where: {
        workerId: data.workerId,
        date: { gte: startOfDay, lte: endOfDay }
      },
      include: { workSite: { select: { name: true } } }
    });

    if (existing) {
      throw ApiError.badRequest(`Attendance already marked for this worker on ${startOfDay.toISOString().split('T')[0]} at ${existing.workSite.name}`);
    }

    // 1. Create the work entry
    const entry = await tx.siteWorkEntry.create({
      data: {
        workSiteId: data.workSiteId,
        workerId: data.workerId,
        date: startOfDay,
        workType: data.workType, 
        hours: data.hours ? parseFloat(data.hours) : null,
        rate: parseFloat(data.rate),
        amount: parseFloat(data.amount),
        notes: data.notes
      },
      include: { workSite: { select: { name: true } } }
    });

    // 2. Add Travel Allowance if provided
    if (data.travelAllowance && parseFloat(data.travelAllowance) > 0) {
      await tx.workerAllowance.create({
        data: {
          workerId: data.workerId,
          type: 'TRAVEL',
          amount: parseFloat(data.travelAllowance),
          date: startOfDay,
          remark: `Travel allowance for site: ${entry.workSite.name}`
        }
      });
    }

    // 3. Add Food Allowance if provided
    if (data.foodAllowance && parseFloat(data.foodAllowance) > 0) {
      await tx.workerAllowance.create({
        data: {
          workerId: data.workerId,
          type: 'FOOD',
          amount: parseFloat(data.foodAllowance),
          date: startOfDay,
          remark: `Food allowance for site: ${entry.workSite.name}`
        }
      });
    }

    return entry;
  });
};

const addBulkWorkEntries = async (workSiteId, entries) => {
  return await prisma.$transaction(async (tx) => {
    const results = [];
    const today = normalizeDate(new Date());

    for (const data of entries) {
      const startOfDay = normalizeDate(data.date);
      const endOfDay = new Date(startOfDay.getTime() + (24 * 60 * 60 * 1000) - 1);

      if (startOfDay > today) continue; // Skip future dates

      // Check if entry already exists
      const existing = await tx.siteWorkEntry.findFirst({
        where: {
          workerId: data.workerId,
          date: { gte: startOfDay, lte: endOfDay }
        }
      });

      if (existing) continue; // Skip if already marked

      // 1. Create the work entry
      const entry = await tx.siteWorkEntry.create({
        data: {
          workSiteId,
          workerId: data.workerId,
          date: startOfDay,
          workType: data.workType,
          hours: data.hours ? parseFloat(data.hours) : null,
          rate: parseFloat(data.rate),
          amount: parseFloat(data.amount),
          notes: data.notes
        },
        include: { workSite: { select: { name: true } } }
      });

      // 2. Add Travel Allowance if provided
      if (data.travelAllowance && parseFloat(data.travelAllowance) > 0) {
        await tx.workerAllowance.create({
          data: {
            workerId: data.workerId,
            type: 'TRAVEL',
            amount: parseFloat(data.travelAllowance),
            date: startOfDay,
            remark: `Travel allowance for site: ${entry.workSite.name}`
          }
        });
      }

      // 3. Add Food Allowance if provided
      if (data.foodAllowance && parseFloat(data.foodAllowance) > 0) {
        await tx.workerAllowance.create({
          data: {
            workerId: data.workerId,
            type: 'FOOD',
            amount: parseFloat(data.foodAllowance),
            date: startOfDay,
            remark: `Food allowance for site: ${entry.workSite.name}`
          }
        });
      }
      results.push(entry);
    }
    return results;
  });
};

const deleteWorkEntry = async (entryId) => {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.siteWorkEntry.findUnique({
      where: { id: entryId },
      include: { workSite: { select: { name: true } } }
    });
    if (!entry) throw ApiError.notFound('Work entry not found');

    // Delete related allowances (TRAVEL/FOOD) that were created for this entry.
    // Match by workerId and either exact date or remark containing site name.
    await tx.workerAllowance.deleteMany({
      where: {
        workerId: entry.workerId,
        type: { in: ['TRAVEL', 'FOOD'] },
        OR: [
          { date: entry.date },
          { remark: { contains: entry.workSite?.name || '', mode: 'insensitive' } }
        ]
      }
    });

    await tx.siteWorkEntry.delete({ where: { id: entryId } });
    return true;
  });
};

module.exports = { 
  getAll, getById, create, update, remove, 
  assignWorkers, removeWorker, addWorkEntry, addBulkWorkEntries, deleteWorkEntry 
};
