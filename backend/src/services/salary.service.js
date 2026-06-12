// ─── Salary Service ────────────────────────────────────────────
// Handles payroll calculation, salary payments, and worker ledger management.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const ledgerService = require('./ledger.service');

/**
 * Normalize a date string or object to UTC midnight (00:00:00.000Z)
 */
const normalizeDate = (d) => {
  const dateStr = d
    ? (typeof d === 'string' ? d.split('T')[0] : d.toISOString().split('T')[0])
    : new Date().toISOString().split('T')[0];
  return new Date(dateStr + 'T00:00:00.000Z');
};

/**
 * Generate a salary calculation for a worker for a period.
 * Uses sequential queries for serverless stability.
 */
const calculatePayroll = async (workerId, startDate, endDate) => {
  const start = normalizeDate(startDate);
  const end = new Date(normalizeDate(endDate).getTime() + (24 * 60 * 60 * 1000) - 1);

  const workEntries = await prisma.siteWorkEntry.findMany({
    where: { workerId, date: { gte: start, lte: end } },
    include: { workSite: { select: { name: true } } }
  });

  const allowances = await prisma.workerAllowance.findMany({
    where: { workerId, date: { gte: start, lte: end } }
  });

  const deductions = await prisma.workerDeduction.findMany({
    where: { workerId, date: { gte: start, lte: end } }
  });

  const payments = await prisma.salaryPayment.findMany({
    where: { workerId, date: { gte: start, lte: end } }
  });

  const totalEarnings = workEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const netPayable = (totalEarnings + totalAllowances) - totalDeductions - totalPaid;

  return {
    workerId,
    startDate: start,
    endDate: end,
    totalEarnings,
    totalAllowances,
    totalDeductions,
    totalPaid,
    netPayable,
    details: { workEntries, allowances, deductions, payments }
  };
};

/**
 * Record a salary payment using sequential direct queries (no transaction block).
 */
const processPayment = async (data) => {
  const { workerId, amount, date, accountId, notes } = data;
  const normalizedDate = normalizeDate(date);

  if (!accountId) throw ApiError.badRequest('Payment account is required');
  if (!amount || amount <= 0) throw ApiError.badRequest('Invalid payment amount');

  // 1. Fetch worker name for ledger description
  const worker = await prisma.worker.findUnique({ where: { id: workerId } });
  if (!worker) throw ApiError.notFound('Worker not found');

  // 2. Create Salary Payment record
  const payment = await prisma.salaryPayment.create({
    data: {
      workerId,
      amount: parseFloat(amount),
      date: normalizedDate,
      accountId,
      notes
    }
  });

  // 3. Update Account Balance via Ledger — sequential, not inside a transaction block
  await ledgerService.recordTransaction({
    accountId,
    date: normalizedDate,
    referenceNo: `PAY-${payment.id.substring(0, 8).toUpperCase()}`,
    moduleType: 'SALARY',
    description: `Salary Payment to ${worker.name}`,
    debit: parseFloat(amount),
    linkedId: payment.id
  });

  return payment;
};

/**
 * Get Worker Ledger — comprehensive history of earnings and payments.
 * Uses sequential queries for serverless stability.
 */
const getWorkerLedger = async (workerId) => {
  const workEntries = await prisma.siteWorkEntry.findMany({
    where: { workerId },
    include: { workSite: { select: { name: true } } },
    orderBy: { date: 'desc' }
  });

  const allowances = await prisma.workerAllowance.findMany({
    where: { workerId },
    orderBy: { date: 'desc' }
  });

  const deductions = await prisma.workerDeduction.findMany({
    where: { workerId },
    orderBy: { date: 'desc' }
  });

  const payments = await prisma.salaryPayment.findMany({
    where: { workerId },
    include: { account: { select: { accountName: true } } },
    orderBy: { date: 'desc' }
  });

  const totalEarned =
    workEntries.reduce((sum, e) => sum + e.amount, 0) +
    allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  const balance = totalEarned - totalDeductions - totalPaid;

  const history = [
    ...workEntries.map(e => ({ ...e, type: 'EARNING', category: 'Site Work' })),
    ...allowances.map(a => ({ ...a, type: 'EARNING', category: 'Allowance', allowanceType: a.type })),
    ...deductions.map(d => ({ ...d, type: 'DEDUCTION', category: 'Deduction', deductionType: d.type })),
    ...payments.map(p => ({ ...p, type: 'PAYMENT', category: 'Salary Payment' }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    workerId,
    stats: { totalEarned, totalDeductions, totalPaid, balance },
    history
  };
};

/**
 * Add Worker Allowance — direct query, no transaction needed.
 */
const addAllowance = async (data) => {
  const normalizedDate = normalizeDate(data.date);
  const today = normalizeDate(new Date());

  if (normalizedDate > today) {
    throw ApiError.badRequest('Cannot add allowance for a future date');
  }

  return await prisma.workerAllowance.create({
    data: {
      workerId: data.workerId,
      type: data.type,
      amount: parseFloat(data.amount),
      date: normalizedDate,
      remark: data.remark
    }
  });
};

/**
 * Add Worker Deduction — direct query, no transaction needed.
 */
const addDeduction = async (data) => {
  const normalizedDate = normalizeDate(data.date);
  const today = normalizeDate(new Date());

  if (normalizedDate > today) {
    throw ApiError.badRequest('Cannot add deduction for a future date');
  }

  return await prisma.workerDeduction.create({
    data: {
      workerId: data.workerId,
      type: data.type,
      amount: parseFloat(data.amount),
      date: normalizedDate,
      remark: data.remark
    }
  });
};

module.exports = {
  calculatePayroll,
  processPayment,
  getWorkerLedger,
  addAllowance,
  addDeduction
};
