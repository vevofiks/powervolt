// ─── Expense Service ───────────────────────────────────────────
// Business logic for tracking business spending, site-specific costs, and office utilities.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');
const ledgerService = require('./ledger.service');

/**
 * Get all expenses with filtering and pagination.
 */
const getAll = async (query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {};
  if (query.category) where.category = query.category;
  if (query.accountId) where.accountId = query.accountId;
  if (query.workSiteId) where.workSiteId = query.workSiteId;
  
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { payee: { contains: query.search, mode: 'insensitive' } },
      { reference: { contains: query.search, mode: 'insensitive' } },
      { notes: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        account: { select: { accountName: true } },
        workSite: { select: { name: true } },
        items: true
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { items, pagination: buildPagination(total, page, limit) };
};

/**
 * Get expense by ID.
 */
const getById = async (id) => {
  const expense = await prisma.expense.findUnique({
    where: { id },
    include: { account: true, workSite: true, items: true }
  });
  if (!expense) throw ApiError.notFound('Expense not found');
  return expense;
};

/**
 * Record a new expense.
 */
const create = async (data) => {
  const { date, title, category, amount, payee, reference, notes, receiptUrl, accountId, workSiteId } = data;

  if (!accountId) throw ApiError.badRequest('Payment account is required');
  if (!amount || amount <= 0) throw ApiError.badRequest('Valid expense amount is required');
  if (!title) throw ApiError.badRequest('Expense title is required');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Expense record
    const expense = await tx.expense.create({
      data: {
        date: date ? new Date(date) : new Date(),
        title,
        category,
        amount: parseFloat(amount),
        payee,
        reference,
        notes,
        receiptUrl,
        accountId,
        workSiteId: workSiteId || null,
        items: data.items && data.items.length > 0 ? {
          create: data.items.map(item => ({
            description: item.description,
            qty: parseFloat(item.qty) || 1,
            rate: parseFloat(item.rate) || 0,
            amount: parseFloat(item.amount) || 0
          }))
        } : undefined
      },
      include: { items: true }
    });

    // 2. Record Ledger Transaction (Debit)
    await ledgerService.recordTransaction({
      accountId,
      date: date || new Date(),
      referenceNo: reference || expense.id,
      moduleType: 'EXPENSE',
      description: `Expense: ${title} (${category})`,
      debit: parseFloat(amount),
      linkedId: expense.id
    }, tx);

    return expense;
  });
};

/**
 * Update an expense. (Limited for accounting integrity)
 */
const update = async (id, data) => {
  const existing = await prisma.expense.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Expense not found');

  // If amount or account changes, we should ideally revert and re-record.
  // For now, let's only allow editing metadata fields.
  const { title, category, payee, reference, notes, receiptUrl, workSiteId } = data;
  
  return await prisma.expense.update({
    where: { id },
    data: { title, category, payee, reference, notes, receiptUrl, workSiteId: workSiteId || null }
  });
};

/**
 * Delete an expense and revert ledger.
 */
const remove = async (id) => {
  const expense = await prisma.expense.findUnique({ where: { id } });
  if (!expense) throw ApiError.notFound('Expense not found');

  return await prisma.$transaction(async (tx) => {
    // 1. Revert Ledger (Credit the amount back)
    await ledgerService.recordTransaction({
      accountId: expense.accountId,
      date: new Date(),
      referenceNo: `REV-${expense.reference || expense.id}`,
      moduleType: 'ADJUSTMENT',
      description: `Reverted Expense: ${expense.title}`,
      credit: expense.amount,
      linkedId: expense.id
    }, tx);

    // 2. Delete record
    await tx.expense.delete({ where: { id } });
    return true;
  });
};

module.exports = { getAll, getById, create, update, remove };
