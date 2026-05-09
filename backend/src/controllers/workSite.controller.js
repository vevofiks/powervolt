const workSiteService = require('../services/workSite.service');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const data = await workSiteService.getAll(req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await workSiteService.getById(req.params.id);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await workSiteService.create(req.body);
    res.status(201).json(ApiResponse.created(data, 'Work Site created successfully'));
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await workSiteService.update(req.params.id, req.body);
    res.json(ApiResponse.success(data, 'Work Site updated successfully'));
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await workSiteService.remove(req.params.id);
    res.json(ApiResponse.success(null, 'Work Site deleted successfully'));
  } catch (error) {
    next(error);
  }
};

// ─── Site Specific Actions ─────────────────────────────────────

const assignWorkers = async (req, res, next) => {
  try {
    const data = await workSiteService.assignWorkers(req.params.id, req.body.workerIds);
    res.json(ApiResponse.success(data, 'Staff assigned successfully'));
  } catch (error) {
    next(error);
  }
};

const removeWorker = async (req, res, next) => {
  try {
    await workSiteService.removeWorker(req.params.id, req.params.workerId);
    res.json(ApiResponse.success(null, 'Staff assignment removed'));
  } catch (error) {
    next(error);
  }
};

const addWorkEntry = async (req, res, next) => {
  try {
    const data = await workSiteService.addWorkEntry({ ...req.body, workSiteId: req.params.id });
    res.status(201).json(ApiResponse.created(data, 'Daily work entry added'));
  } catch (error) {
    next(error);
  }
};

const deleteWorkEntry = async (req, res, next) => {
  try {
    await workSiteService.deleteWorkEntry(req.params.entryId);
    res.json(ApiResponse.success(null, 'Work entry deleted'));
  } catch (error) {
    next(error);
  }
};

const addBulkWorkEntries = async (req, res, next) => {
  try {
    const data = await workSiteService.addBulkWorkEntries(req.params.id, req.body.entries);
    res.status(201).json(ApiResponse.created(data, 'Bulk work entries added successfully'));
  } catch (error) {
    next(error);
  }
};

module.exports = { 
  getAll, getById, create, update, remove, 
  assignWorkers, removeWorker, addWorkEntry, addBulkWorkEntries, deleteWorkEntry 
};
