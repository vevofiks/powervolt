// ─── Stock Service ─────────────────────────────────────────────
// Reusable stock management logic. Other modules (sales, purchases)
// call this to update product stock and record history.

const prisma = require('../models/prisma');
const ApiError = require('../utils/ApiError');
const { buildPagination } = require('../utils/helpers');

/**
 * Record a stock movement and update product stock atomically.
 * @param {object} data - { productId, type, quantity, reference, remark, date }
 * @param {object} tx - Optional Prisma transaction client
 * @returns {object} The created stock history entry
 */
const recordMovement = async ({ productId, type, quantity, reference, remark, date }, tx) => {
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

  const execute = async (client) => {
    const product = await client.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw ApiError.notFound('Product not found');
    }

    const newStock = product.stockQty + stockChange;

    if (outTypes.includes(type) && newStock < 0) {
      throw ApiError.badRequest(`Insufficient stock for ${product.productName}. Available: ${product.stockQty} ${product.unit}`);
    }

    await client.product.update({
      where: { id: productId },
      data: { stockQty: newStock },
    });

    const entry = await client.stockHistory.create({
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

  if (tx) {
    return await execute(tx);
  }

  return await prisma.$transaction(async (t) => await execute(t));
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
