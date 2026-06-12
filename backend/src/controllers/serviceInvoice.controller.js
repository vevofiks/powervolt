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

const updatePaymentStatus = catchAsync(async (req, res) => {
  const invoice = await serviceInvoiceService.updatePaymentStatus(req.params.id, req.body.paymentStatus);
  res.status(200).json({ success: true, data: invoice });
});

const remove = catchAsync(async (req, res) => {
  await serviceInvoiceService.remove(req.params.id);
  res.status(200).json({ success: true, message: 'Service Invoice deleted successfully' });
});

module.exports = { create, getAll, getById, updatePaymentStatus, remove };
