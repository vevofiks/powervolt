const expenseService = require('../services/expense.service');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const data = await expenseService.getAll(req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await expenseService.getById(req.params.id);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await expenseService.create(req.body);
    res.status(201).json(ApiResponse.created(data, 'Expense recorded successfully'));
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await expenseService.update(req.params.id, req.body);
    res.json(ApiResponse.success(data, 'Expense updated successfully'));
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await expenseService.remove(req.params.id);
    res.json(ApiResponse.success(null, 'Expense deleted successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove };
