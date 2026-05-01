// ─── Customer Controller ──────────────────────────────────────────
// Request handlers for the Customer Management Module.

const customerService = require('../services/customer.service');
const { catchAsync } = require('../utils/catchAsync');

const getAll = catchAsync(async (req, res) => {
  const result = await customerService.getAll(req.query);
  res.json({ success: true, data: result });
});

const getById = catchAsync(async (req, res) => {
  const result = await customerService.getById(req.params.id);
  res.json({ success: true, data: result });
});

const create = catchAsync(async (req, res) => {
  const result = await customerService.create(req.body);
  res.status(201).json({ success: true, data: result });
});

const update = catchAsync(async (req, res) => {
  const result = await customerService.update(req.params.id, req.body);
  res.json({ success: true, data: result });
});

const remove = catchAsync(async (req, res) => {
  await customerService.remove(req.params.id);
  res.json({ success: true, message: 'Customer deleted successfully' });
});

module.exports = { getAll, getById, create, update, remove };
