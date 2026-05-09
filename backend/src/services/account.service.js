// ─── Account Service ───────────────────────────────────────────
// Full CRUD + balance management for accounts.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');
const { PAGINATION } = require('../utils/constants');
const ledgerService = require('./ledger.service');

/**
 * Get all accounts with pagination and search.
 */
const getAll = async (query = {}) => {
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = {};

  // Search by account name or bank name
  if (query.search) {
    where.OR = [
      { accountName: { contains: query.search, mode: 'insensitive' } },
      { bankName: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.isActive !== undefined) {
    where.isActive = query.isActive === 'true';
  }

  const [items, total] = await Promise.all([
    prisma.account.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
      include: {
        _count: { select: { ledgerTransactions: true } },
      },
    }),
    prisma.account.count({ where }),
  ]);

  return {
    items,
    pagination: buildPagination(total, page, limit),
  };
};

/**
 * Get a single account by ID with recent ledger entries.
 */
const getById = async (id) => {
  const account = await prisma.account.findUnique({
    where: { id },
    include: {
      ledgerTransactions: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      _count: { select: { ledgerTransactions: true } },
    },
  });

  if (!account) {
    throw ApiError.notFound('Account not found');
  }

  return account;
};

/**
 * Create a new account.
 */
const create = async (data) => {
  const { accountName, bankName, accountNumber, openingBalance, notes } = data;

  if (!accountName || !accountName.trim()) {
    throw ApiError.badRequest('Account name is required');
  }

  // Check for duplicate account name
  const existing = await prisma.account.findFirst({
    where: { accountName: { equals: accountName, mode: 'insensitive' } },
  });

  if (existing) {
    throw ApiError.badRequest('An account with this name already exists');
  }

  const balance = parseFloat(openingBalance) || 0;

  const account = await prisma.account.create({
    data: {
      accountName: accountName.trim(),
      bankName: bankName?.trim() || null,
      accountNumber: accountNumber?.trim() || null,
      openingBalance: balance,
      currentBalance: balance,
      notes: notes?.trim() || null,
    },
  });

  return account;
};

/**
 * Update an existing account.
 */
const update = async (id, data) => {
  const existing = await prisma.account.findUnique({ where: { id } });
  if (!existing) {
    throw ApiError.notFound('Account not found');
  }

  const { accountName, bankName, accountNumber, notes, isActive } = data;

  // Check for duplicate name (exclude current account)
  if (accountName) {
    const duplicate = await prisma.account.findFirst({
      where: {
        accountName: { equals: accountName, mode: 'insensitive' },
        NOT: { id },
      },
    });
    if (duplicate) {
      throw ApiError.badRequest('An account with this name already exists');
    }
  }

  const account = await prisma.account.update({
    where: { id },
    data: {
      ...(accountName && { accountName: accountName.trim() }),
      ...(bankName !== undefined && { bankName: bankName?.trim() || null }),
      ...(accountNumber !== undefined && { accountNumber: accountNumber?.trim() || null }),
      ...(notes !== undefined && { notes: notes?.trim() || null }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return account;
};

/**
 * Delete an account (only if no ledger entries exist).
 */
const remove = async (id) => {
  const account = await prisma.account.findUnique({
    where: { id },
    include: { _count: { select: { ledgerTransactions: true } } },
  });

  if (!account) {
    throw ApiError.notFound('Account not found');
  }

  if (account._count.ledgerTransactions > 0) {
    throw ApiError.badRequest(
      'Cannot delete account with existing transactions. Deactivate it instead.'
    );
  }

  await prisma.account.delete({ where: { id } });
  return true;
};

/**
 * Get account summary (total balances across all accounts).
 */
const getSummary = async () => {
  const accounts = await prisma.account.findMany({
    where: { isActive: true },
    select: { currentBalance: true },
  });

  const totalBalance = accounts.reduce((sum, a) => sum + a.currentBalance, 0);

  return {
    totalAccounts: accounts.length,
    totalBalance,
  };
};

/**
 * Get ledger entries for an account.
 */
const getLedger = async (accountId, query) => {
  // Verify the account exists
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, accountName: true, currentBalance: true },
  });

  if (!account) {
    throw ApiError.notFound('Account not found');
  }

  const ledger = await ledgerService.getAccountStatement(accountId, query);

  return {
    account,
    ...ledger,
  };
};

module.exports = { getAll, getById, create, update, remove, getSummary, getLedger };