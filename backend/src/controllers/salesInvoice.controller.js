const salesInvoiceService = require('../services/salesInvoice.service');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const data = await salesInvoiceService.getAll(req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await salesInvoiceService.getById(req.params.id);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await salesInvoiceService.create(req.body);
    res.status(201).json(ApiResponse.created(data, 'Sales Invoice created successfully'));
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await salesInvoiceService.remove(req.params.id);
    res.json(ApiResponse.success(null, 'Sales Invoice deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const updatePaymentStatus = async (req, res, next) => {
  try {
    const data = await salesInvoiceService.updatePaymentStatus(req.params.id, req.body.paymentStatus);
    res.json(ApiResponse.success(data, 'Payment status updated successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, remove, updatePaymentStatus };
