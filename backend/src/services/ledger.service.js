// ─── Ledger Service ────────────────────────────────────────────
// Professional money movement tracking.
// Every financial transaction in the system (Sales, Expenses, Salaries, etc.)
// must be recorded through this service to maintain a unified account statement.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');

/**
 * Record a professional ledger transaction and update the account balance.
 * @param {object} params - { accountId, date, referenceNo, moduleType, description, credit, debit, linkedId, createdBy }
 * @param {object} tx - Optional Prisma transaction client
 */
const recordTransaction = async (params, tx) => {
  const { 
    accountId, 
    date, 
    referenceNo, 
    moduleType, 
    description, 
    credit = 0, 
    debit = 0, 
    linkedId, 
    createdBy 
  } = params;

  if (!accountId) throw ApiError.badRequest('Account ID is required');
  if (credit < 0 || debit < 0) throw ApiError.badRequest('Credit/Debit must be positive numbers');

  const execute = async (client) => {
    // 1. Fetch account and verify
    const account = await client.account.findUnique({ where: { id: accountId } });
    if (!account) throw ApiError.notFound('Account not found');
    if (!account.isActive) throw ApiError.badRequest('Cannot transact on an inactive account');

    // 2. Calculate balance change
    const balanceChange = credit - debit;
    const newBalance = account.currentBalance + balanceChange;

    // 3. Update Account Balance
    await client.account.update({
      where: { id: accountId },
      data: { currentBalance: newBalance }
    });

    // 4. Create Ledger Transaction Record
    return await client.ledgerTransaction.create({
      data: {
        accountId,
        date: date ? new Date(date) : new Date(),
        referenceNo: referenceNo || null,
        moduleType,
        description: description || null,
        credit,
        debit,
        balanceAfter: newBalance,
        linkedId: linkedId || null,
        createdBy: createdBy || null
      }
    });
  };

  if (tx) return await execute(tx);
  return await prisma.$transaction(async (t) => await execute(t));
};

/**
 * Get account statement (history) with running balance and summary.
 */
const getAccountStatement = async (accountId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 50; // Statements usually show more rows
  const skip = (page - 1) * limit;

  const where = { accountId };

  // Filters
  if (query.moduleType) where.moduleType = query.moduleType;
  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }
  if (query.type === 'CREDIT') where.credit = { gt: 0 };
  if (query.type === 'DEBIT') where.debit = { gt: 0 };
  if (query.search) {
    where.OR = [
      { referenceNo: { contains: query.search, mode: 'insensitive' } },
      { description: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  const [items, total, summary] = await Promise.all([
    prisma.ledgerTransaction.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit
    }),
    prisma.ledgerTransaction.count({ where }),
    prisma.ledgerTransaction.aggregate({
      where,
      _sum: { credit: true, debit: true }
    })
  ]);

  return {
    items,
    summary: {
      totalCredit: summary._sum.credit || 0,
      totalDebit: summary._sum.debit || 0,
      netMovement: (summary._sum.credit || 0) - (summary._sum.debit || 0)
    },
    pagination: buildPagination(total, page, limit)
  };
};

module.exports = {
  recordTransaction,
  getAccountStatement,
  // Legacy support aliases if needed (for safe migration)
  recordEntry: recordTransaction 
};
