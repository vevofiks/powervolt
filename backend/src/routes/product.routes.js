const router = require('express').Router();
const controller = require('../controllers/product.controller');

// Special routes (before /:id to avoid param collision)
router.get('/search', controller.search);
router.get('/low-stock', controller.getLowStock);
router.post('/find-or-create', controller.findOrCreate);

// CRUD
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Stock routes
router.get('/:id/stock-history', controller.getStockHistory);
router.post('/:id/stock-adjustment', controller.addStockAdjustment);

module.exports = router;
