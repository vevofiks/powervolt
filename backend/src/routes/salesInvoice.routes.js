const router = require('express').Router();
const controller = require('../controllers/salesInvoice.controller');

router.get('/', controller.getAll);
router.get('/next-number', controller.getNextInvoiceNo);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
router.patch('/:id/payment-status', controller.updatePaymentStatus);

module.exports = router;
