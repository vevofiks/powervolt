const express = require('express');
const router = express.Router();
const serviceInvoiceController = require('../controllers/serviceInvoice.controller');

router.post('/', serviceInvoiceController.create);
router.get('/', serviceInvoiceController.getAll);
router.get('/:id', serviceInvoiceController.getById);

module.exports = router;
