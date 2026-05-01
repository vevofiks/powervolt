const salaryService = require('../services/salary.service');
const { catchAsync } = require('../utils/catchAsync');

const calculateDraft = catchAsync(async (req, res) => {
  const { workerId, startDate, endDate } = req.query;
  const result = await salaryService.calculatePayroll(workerId, startDate, endDate);
  res.json({ success: true, data: result });
});

const paySalary = catchAsync(async (req, res) => {
  const result = await salaryService.processPayment(req.body);
  res.status(201).json({ success: true, data: result });
});

const getLedger = catchAsync(async (req, res) => {
  const result = await salaryService.getWorkerLedger(req.params.workerId);
  res.json({ success: true, data: result });
});

const addAllowance = catchAsync(async (req, res) => {
  const result = await salaryService.addAllowance(req.body);
  res.status(201).json({ success: true, data: result });
});

const addDeduction = catchAsync(async (req, res) => {
  const result = await salaryService.addDeduction(req.body);
  res.status(201).json({ success: true, data: result });
});

module.exports = { calculateDraft, paySalary, getLedger, addAllowance, addDeduction };
