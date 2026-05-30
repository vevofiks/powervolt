const router = require('express').Router();
const controller = require('../controllers/salesInvoice.controller');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.delete('/:id', controller.remove);
router.patch('/:id/payment-status', controller.updatePaymentStatus);

module.exports = router;
