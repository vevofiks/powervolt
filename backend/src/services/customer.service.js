// ─── Customer Service ───────────────────────────────────────────
// Business logic for managing customer profiles and relationships.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');

/**
 * Get all customers with filtering and pagination.
 */
const getAll = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: 'insensitive' } },
      { phone: { contains: query.search, mode: 'insensitive' } },
      { gstNumber: { contains: query.search, mode: 'insensitive' } },
      { contactPerson: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { name: 'asc' },
      skip,
      take: limit,
      include: {
        _count: {
          select: { salesInvoices: true }
        }
      }
    }),
    prisma.customer.count({ where }),
  ]);

  return { items, pagination: buildPagination(total, page, limit) };
};

/**
 * Get customer by ID with detailed history.
 */
const getById = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      salesInvoices: {
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          account: { select: { accountName: true } }
        }
      },
      _count: {
        select: { salesInvoices: true }
      }
    }
  });

  if (!customer) throw ApiError.notFound('Customer not found');

  // Calculate totals
  const aggregate = await prisma.salesInvoice.aggregate({
    where: { customerId: id },
    _sum: { totalAmount: true }
  });

  return {
    ...customer,
    stats: {
      totalInvoices: customer._count.salesInvoices,
      totalSalesAmount: aggregate._sum.totalAmount || 0
    }
  };
};

/**
 * Create a new customer.
 */
const create = async (data) => {
  if (!data.name) throw ApiError.badRequest('Customer name is required');
  
  // Optional: Check if phone already exists
  if (data.phone) {
    const existing = await prisma.customer.findFirst({
      where: { phone: data.phone }
    });
    if (existing) {
      throw ApiError.badRequest('A customer with this phone number already exists.');
    }
  }

  return await prisma.customer.create({ data });
};

/**
 * Update customer details.
 */
const update = async (id, data) => {
  const existing = await prisma.customer.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Customer not found');

  return await prisma.customer.update({
    where: { id },
    data
  });
};

/**
 * Delete a customer. (Only if no invoices linked, or handle cascade)
 */
const remove = async (id) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: { _count: { select: { salesInvoices: true } } }
  });

  if (!customer) throw ApiError.notFound('Customer not found');
  if (customer._count.salesInvoices > 0) {
    throw ApiError.badRequest('Cannot delete customer with existing invoices');
  }

  await prisma.customer.delete({ where: { id } });
  return true;
};

module.exports = { getAll, getById, create, update, remove };
