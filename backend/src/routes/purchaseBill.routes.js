const express = require('express');
const purchaseBillController = require('../controllers/purchaseBill.controller');

const router = express.Router();

router
  .route('/')
  .post(purchaseBillController.createBill)
  .get(purchaseBillController.getAllBills);

router
  .route('/:id')
  .get(purchaseBillController.getBillById)
  .delete(purchaseBillController.deleteBill);

router.patch('/:id/payment-status', purchaseBillController.updatePaymentStatus);

module.exports = router;
