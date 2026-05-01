const accountService = require('../services/account.service');
const ledgerService = require('../services/ledger.service');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const data = await accountService.getAll(req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await accountService.getById(req.params.id);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await accountService.create(req.body);
    res.status(201).json(ApiResponse.created(data));
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await accountService.update(req.params.id, req.body);
    res.json(ApiResponse.success(data, 'Account updated successfully'));
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await accountService.remove(req.params.id);
    res.json(ApiResponse.success(null, 'Account deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const data = await accountService.getSummary();
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getLedger = async (req, res, next) => {
  try {
    const data = await accountService.getLedger(req.params.id, req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const addLedgerEntry = async (req, res, next) => {
  try {
    const data = await ledgerService.recordEntry({
      accountId: req.params.id,
      ...req.body,
    });
    res.status(201).json(ApiResponse.created(data, 'Transaction recorded'));
  } catch (error) {
    next(error);
  }
};

const getStatement = async (req, res, next) => {
  try {
    const data = await ledgerService.getAccountStatement(req.params.id, req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, create, update, remove, getSummary, getLedger, addLedgerEntry, getStatement };
