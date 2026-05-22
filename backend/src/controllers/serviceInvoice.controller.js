const serviceInvoiceService = require('../services/serviceInvoice.service');
const { catchAsync } = require('../utils/catchAsync');

const create = catchAsync(async (req, res) => {
  const invoice = await serviceInvoiceService.create(req.body);
  res.status(201).json({ success: true, data: invoice });
});

const getAll = catchAsync(async (req, res) => {
  const invoices = await serviceInvoiceService.getAll();
  res.status(200).json({ success: true, data: invoices });
});

const getById = catchAsync(async (req, res) => {
  const invoice = await serviceInvoiceService.getById(req.params.id);
  res.status(200).json({ success: true, data: invoice });
});

module.exports = { create, getAll, getById };
