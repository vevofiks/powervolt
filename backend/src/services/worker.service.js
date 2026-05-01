const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');

const getAll = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.worker.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { workSites: true, workEntries: true }
        }
      }
    }),
    prisma.worker.count({ where }),
  ]);

  return { items, pagination: buildPagination(total, page, limit) };
};

const getById = async (id) => {
  const worker = await prisma.worker.findUnique({
    where: { id },
    include: {
      workSites: { include: { workSite: true } },
      workEntries: { orderBy: { date: 'desc' }, take: 20, include: { workSite: true } },
      allowances: { orderBy: { date: 'desc' }, take: 10 },
      deductions: { orderBy: { date: 'desc' }, take: 10 },
      payments: { orderBy: { date: 'desc' }, take: 10 }
    }
  });

  if (!worker) throw ApiError.notFound('Worker not found');
  return worker;
};

const create = async (data) => {
  if (!data.name) throw ApiError.badRequest('Worker name is required');
  return await prisma.worker.create({ data });
};

const update = async (id, data) => {
  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Worker not found');
  return await prisma.worker.update({ where: { id }, data });
};

const remove = async (id) => {
  const existing = await prisma.worker.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Worker not found');
  await prisma.worker.delete({ where: { id } });
  return true;
};

module.exports = { getAll, getById, create, update, remove };
