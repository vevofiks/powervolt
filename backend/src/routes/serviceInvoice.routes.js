const express = require('express');
const router = express.Router();
const serviceInvoiceController = require('../controllers/serviceInvoice.controller');

router.post('/', serviceInvoiceController.create);
router.get('/', serviceInvoiceController.getAll);
router.get('/:id', serviceInvoiceController.getById);
router.patch('/:id/payment-status', serviceInvoiceController.updatePaymentStatus);
router.delete('/:id', serviceInvoiceController.remove);

module.exports = router;
