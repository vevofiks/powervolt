const productService = require('../services/product.service');
const stockService = require('../services/stock.service');
const ApiResponse = require('../utils/ApiResponse');

const getAll = async (req, res, next) => {
  try {
    const data = await productService.getAll(req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await productService.getById(req.params.id);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const search = async (req, res, next) => {
  try {
    const data = await productService.search(req.query.q);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await productService.create(req.body);
    res.status(201).json(ApiResponse.created(data));
  } catch (error) {
    next(error);
  }
};

const findOrCreate = async (req, res, next) => {
  try {
    const data = await productService.findOrCreate(req.body);
    res.status(data.created ? 201 : 200).json(
      data.created
        ? ApiResponse.created(data, 'Product auto-created')
        : ApiResponse.success(data, 'Product found')
    );
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await productService.update(req.params.id, req.body);
    res.json(ApiResponse.success(data, 'Product updated successfully'));
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await productService.remove(req.params.id);
    res.json(ApiResponse.success(null, 'Product deleted successfully'));
  } catch (error) {
    next(error);
  }
};

const getLowStock = async (req, res, next) => {
  try {
    const data = await productService.getLowStock();
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getStockHistory = async (req, res, next) => {
  try {
    const data = await productService.getStockHistory(req.params.id, req.query);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const addStockAdjustment = async (req, res, next) => {
  try {
    const data = await stockService.recordMovement({
      productId: req.params.id,
      ...req.body,
    });
    res.status(201).json(ApiResponse.created(data, 'Stock adjusted'));
  } catch (error) {
    next(error);
  }
};

module.exports = { getAll, getById, search, create, findOrCreate, update, remove, getLowStock, getStockHistory, addStockAdjustment };
