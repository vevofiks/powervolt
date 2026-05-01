const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const ledgerService = require('./ledger.service');

/**
 * Generate a salary calculation for a worker for a period.
 */
const calculatePayroll = async (workerId, startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // 1. Get Site Work Entries
  const workEntries = await prisma.siteWorkEntry.findMany({
    where: { workerId, date: { gte: start, lte: end } },
    include: { workSite: { select: { name: true } } }
  });
  
  // 2. Get Allowances
  const allowances = await prisma.workerAllowance.findMany({
    where: { workerId, date: { gte: start, lte: end } }
  });
  
  // 3. Get Deductions
  const deductions = await prisma.workerDeduction.findMany({
    where: { workerId, date: { gte: start, lte: end } }
  });

  const totalEarnings = workEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalAllowances = allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  
  const netPayable = (totalEarnings + totalAllowances) - totalDeductions;

  return {
    workerId,
    startDate: start,
    endDate: end,
    totalEarnings,
    totalAllowances,
    totalDeductions,
    netPayable,
    details: {
      workEntries,
      allowances,
      deductions
    }
  };
};

/**
 * Record a salary payment.
 */
const processPayment = async (data) => {
  const { workerId, amount, date, accountId, notes } = data;
  
  if (!accountId) throw ApiError.badRequest('Payment account is required');
  if (!amount || amount <= 0) throw ApiError.badRequest('Invalid payment amount');

  return await prisma.$transaction(async (tx) => {
    // 1. Create Salary Payment record
    const payment = await tx.salaryPayment.create({
      data: {
        workerId,
        amount: parseFloat(amount),
        date: date ? new Date(date) : new Date(),
        accountId,
        notes
      }
    });

    // 2. Update Account Balance via Ledger
    const worker = await tx.worker.findUnique({ where: { id: workerId } });
    
    await ledgerService.recordTransaction({
      accountId,
      date: date ? new Date(date) : new Date(),
      referenceNo: `PAY-${payment.id.substring(0, 8).toUpperCase()}`,
      moduleType: 'SALARY',
      description: `Salary Payment to ${worker.name}`,
      debit: parseFloat(amount),
      linkedId: payment.id
    }, tx);

    return payment;
  });
};

/**
 * Get Worker Ledger - Comprehensive history of earnings and payments
 */
const getWorkerLedger = async (workerId) => {
  const [workEntries, allowances, deductions, payments] = await Promise.all([
    prisma.siteWorkEntry.findMany({ where: { workerId }, include: { workSite: { select: { name: true } } }, orderBy: { date: 'desc' } }),
    prisma.workerAllowance.findMany({ where: { workerId }, orderBy: { date: 'desc' } }),
    prisma.workerDeduction.findMany({ where: { workerId }, orderBy: { date: 'desc' } }),
    prisma.salaryPayment.findMany({ where: { workerId }, include: { account: { select: { accountName: true } } }, orderBy: { date: 'desc' } })
  ]);

  const totalEarned = workEntries.reduce((sum, e) => sum + e.amount, 0) + allowances.reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + d.amount, 0);
  
  const balance = totalEarned - totalDeductions - totalPaid;

  // Combine and sort for a chronological view
  const history = [
    ...workEntries.map(e => ({ type: 'EARNING', category: 'Site Work', ...e })),
    ...allowances.map(a => ({ type: 'EARNING', category: 'Allowance', ...a })),
    ...deductions.map(d => ({ type: 'DEDUCTION', category: 'Deduction', ...d })),
    ...payments.map(p => ({ type: 'PAYMENT', category: 'Salary Payment', ...p }))
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    workerId,
    stats: {
      totalEarned,
      totalDeductions,
      totalPaid,
      balance
    },
    history
  };
};



/**
 * Add Worker Allowance
 */
const addAllowance = async (data) => {
  return await prisma.workerAllowance.create({
    data: {
      workerId: data.workerId,
      type: data.type,
      amount: parseFloat(data.amount),
      date: data.date ? new Date(data.date) : new Date(),
      remark: data.remark
    }
  });
};

/**
 * Add Worker Deduction
 */
const addDeduction = async (data) => {
  return await prisma.workerDeduction.create({
    data: {
      workerId: data.workerId,
      type: data.type,
      amount: parseFloat(data.amount),
      date: data.date ? new Date(data.date) : new Date(),
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
