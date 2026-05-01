// ─── Customer Routes ──────────────────────────────────────────────
// API endpoints for the Customer Management Module.

const router = require('express').Router();
const customerController = require('../controllers/customer.controller');

router.get('/', customerController.getAll);
router.get('/:id', customerController.getById);
router.post('/', customerController.create);
router.put('/:id', customerController.update);
router.delete('/:id', customerController.remove);

module.exports = router;
