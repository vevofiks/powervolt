const workerService = require('../services/worker.service');
const { catchAsync } = require('../utils/catchAsync');

const getAll = catchAsync(async (req, res) => {
  const result = await workerService.getAll(req.query);
  res.json({ success: true, data: result });
});

const getById = catchAsync(async (req, res) => {
  const result = await workerService.getById(req.params.id);
  res.json({ success: true, data: result });
});

const create = catchAsync(async (req, res) => {
  const result = await workerService.create(req.body);
  res.status(201).json({ success: true, data: result });
});

const update = catchAsync(async (req, res) => {
  const result = await workerService.update(req.params.id, req.body);
  res.json({ success: true, data: result });
});

const remove = catchAsync(async (req, res) => {
  await workerService.remove(req.params.id);
  res.json({ success: true, message: 'Worker deleted successfully' });
});

module.exports = { getAll, getById, create, update, remove };
