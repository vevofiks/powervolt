// ─── Product Service ───────────────────────────────────────────
// Full CRUD with search, stock management, and low stock alerts.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');
const { PAGINATION, PRODUCT_CATEGORY, LOW_STOCK_THRESHOLD } = require('../utils/constants');
const stockService = require('./stock.service');

/**
 * Get all products with pagination, search, and filters.
 */
const getAll = async (query = {}) => {
  const page = parseInt(query.page) || PAGINATION.DEFAULT_PAGE;
  const limit = parseInt(query.limit) || PAGINATION.DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const where = {};

  if (query.search) {
    where.OR = [
      { productName: { contains: query.search, mode: 'insensitive' } },
      { sku: { contains: query.search, mode: 'insensitive' } },
      { hsnCode: { contains: query.search, mode: 'insensitive' } },
    ];
  }

  if (query.category) where.category = query.category;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';

  // Low stock filter
  if (query.lowStock === 'true') {
    where.stockQty = { lte: prisma.raw('\"lowStockThreshold\"') };
    // Fallback: filter in application layer
    delete where.stockQty;
  }

  const orderBy = {};
  if (query.sortBy) {
    orderBy[query.sortBy] = query.sortOrder || 'asc';
  } else {
    orderBy.createdAt = 'desc';
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // Apply low stock filter in application layer
  let filteredItems = items;
  if (query.lowStock === 'true') {
    filteredItems = items.filter((p) => p.stockQty <= p.lowStockThreshold);
  }

  return {
    items: filteredItems,
    pagination: buildPagination(total, page, limit),
  };
};

/**
 * Get a single product by ID with recent stock history.
 */
const getById = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      stockHistory: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      _count: { select: { stockHistory: true } },
    },
  });

  if (!product) throw ApiError.notFound('Product not found');
  return product;
};

/**
 * Search products (for use in invoice dropdowns).
 */
const search = async (query = '') => {
  if (!query || query.length < 1) return [];

  const products = await prisma.product.findMany({
    where: {
      isActive: true,
      OR: [
        { productName: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      productName: true,
      sku: true,
      category: true,
      salePrice: true,
      purchasePrice: true,
      gstPercent: true,
      stockQty: true,
      unit: true,
    },
    take: 20,
    orderBy: { productName: 'asc' },
  });

  return products;
};

/**
 * Create a new product.
 */
const create = async (data) => {
  const { productName, category, sku, hsnCode, purchasePrice, salePrice, gstPercent, stockQty, unit, lowStockThreshold } = data;

  if (!productName?.trim()) throw ApiError.badRequest('Product name is required');
  if (!category) throw ApiError.badRequest('Category is required');

  // Validate category
  const validCategories = Object.values(PRODUCT_CATEGORY);
  if (!validCategories.includes(category)) {
    throw ApiError.badRequest(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
  }

  // Check duplicate SKU
  if (sku) {
    const existing = await prisma.product.findUnique({ where: { sku } });
    if (existing) throw ApiError.badRequest('A product with this SKU already exists');
  }

  const product = await prisma.product.create({
    data: {
      productName: productName.trim(),
      category,
      sku: sku?.trim() || null,
      hsnCode: hsnCode?.trim() || null,
      purchasePrice: parseFloat(purchasePrice) || 0,
      salePrice: parseFloat(salePrice) || 0,
      gstPercent: parseFloat(gstPercent) || 0,
      stockQty: parseFloat(stockQty) || 0,
      unit: unit || 'Nos',
      lowStockThreshold: parseFloat(lowStockThreshold) || LOW_STOCK_THRESHOLD,
    },
  });

  // If initial stock > 0, record stock history
  if (product.stockQty > 0) {
    await prisma.stockHistory.create({
      data: {
        productId: product.id,
        type: 'ADJUSTMENT',
        quantity: product.stockQty,
        stockAfter: product.stockQty,
        remark: 'Initial stock',
      },
    });
  }

  return product;
};

/**
 * Create or find a product (for auto-creation from purchase invoices).
 */
const findOrCreate = async (data) => {
  const { productName, sku } = data;

  // Try to find by SKU first, then by name
  let product = null;
  if (sku) {
    product = await prisma.product.findUnique({ where: { sku } });
  }
  if (!product && productName) {
    product = await prisma.product.findFirst({
      where: { productName: { equals: productName, mode: 'insensitive' } },
    });
  }

  if (product) return { product, created: false };

  // Create new product
  const newProduct = await create(data);
  return { product: newProduct, created: true };
};

/**
 * Update a product.
 */
const update = async (id, data) => {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound('Product not found');

  const { productName, category, sku, hsnCode, purchasePrice, salePrice, gstPercent, unit, lowStockThreshold, isActive } = data;

  // Check duplicate SKU
  if (sku && sku !== existing.sku) {
    const duplicate = await prisma.product.findUnique({ where: { sku } });
    if (duplicate) throw ApiError.badRequest('A product with this SKU already exists');
  }

  if (category) {
    const validCategories = Object.values(PRODUCT_CATEGORY);
    if (!validCategories.includes(category)) {
      throw ApiError.badRequest(`Invalid category. Must be one of: ${validCategories.join(', ')}`);
    }
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(productName && { productName: productName.trim() }),
      ...(category && { category }),
      ...(sku !== undefined && { sku: sku?.trim() || null }),
      ...(hsnCode !== undefined && { hsnCode: hsnCode?.trim() || null }),
      ...(purchasePrice !== undefined && { purchasePrice: parseFloat(purchasePrice) || 0 }),
      ...(salePrice !== undefined && { salePrice: parseFloat(salePrice) || 0 }),
      ...(gstPercent !== undefined && { gstPercent: parseFloat(gstPercent) || 0 }),
      ...(unit && { unit }),
      ...(lowStockThreshold !== undefined && { lowStockThreshold: parseFloat(lowStockThreshold) || LOW_STOCK_THRESHOLD }),
      ...(isActive !== undefined && { isActive }),
    },
  });

  return product;
};

/**
 * Delete a product (only if no stock history).
 */
const remove = async (id) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { stockHistory: true } } },
  });

  if (!product) throw ApiError.notFound('Product not found');

  if (product._count.stockHistory > 0) {
    throw ApiError.badRequest('Cannot delete product with stock history. Deactivate it instead.');
  }

  await prisma.product.delete({ where: { id } });
  return true;
};

/**
 * Get low stock products.
 */
const getLowStock = async () => {
  const products = await prisma.product.findMany({
    where: { isActive: true },
  });

  return products.filter((p) => p.stockQty <= p.lowStockThreshold);
};

/**
 * Get stock history for a product.
 */
const getStockHistory = async (productId, query) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, productName: true, stockQty: true, unit: true },
  });

  if (!product) throw ApiError.notFound('Product not found');

  const history = await stockService.getByProductId(productId, query);
  return { product, ...history };
};

module.exports = { getAll, getById, search, create, findOrCreate, update, remove, getLowStock, getStockHistory };
