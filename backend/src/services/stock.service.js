// ─── Stock Service ─────────────────────────────────────────────
// Reusable stock management logic. Other modules (sales, purchases)
// call this to update product stock and record history.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');

/**
 * Record a stock movement and update product stock.
 * @param {object} data - { productId, type, quantity, reference, remark, date }
 * @returns {object} The created stock history entry
 */
const recordMovement = async ({ productId, type, quantity, reference, remark, date }) => {
  if (quantity <= 0) {
    throw ApiError.badRequest('Quantity must be greater than 0');
  }

  const inTypes = ['PURCHASE_IN', 'RETURN_IN', 'ADJUSTMENT'];
  const outTypes = ['SALE_OUT', 'DAMAGE_OUT'];

  let stockChange = quantity;
  if (outTypes.includes(type)) {
    stockChange = -quantity;
  } else if (type === 'ADJUSTMENT') {
    stockChange = quantity;
  }

  // 1. Fetch product and verify
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw ApiError.notFound('Product not found');
  }

  const newStock = product.currentStock + stockChange;

  if (outTypes.includes(type) && newStock < 0) {
    throw ApiError.badRequest(`Insufficient stock for ${product.productName}. Available: ${product.currentStock} ${product.unit}`);
  }

  // 2. Update Product Stock
  await prisma.product.update({
    where: { id: productId },
    data: { currentStock: newStock },
  });

  // 3. Create Stock History Entry
  const entry = await prisma.stockHistory.create({
    data: {
      productId,
      type,
      quantity: Math.abs(quantity),
      stockAfter: newStock,
      reference: reference || null,
      remark: remark || null,
      date: date ? new Date(date) : new Date(),
    },
  });

  return entry;
};

/**
 * Get stock history for a product with pagination.
 */
const getByProductId = async (productId, query = {}) => {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = { productId };
  if (query.type) where.type = query.type;

  if (query.startDate || query.endDate) {
    where.date = {};
    if (query.startDate) where.date.gte = new Date(query.startDate);
    if (query.endDate) where.date.lte = new Date(query.endDate);
  }

  const [items, total] = await Promise.all([
    prisma.stockHistory.findMany({
      where,
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.stockHistory.count({ where }),
  ]);

  return { items, pagination: buildPagination(total, page, limit) };
};

module.exports = { recordMovement, getByProductId };
