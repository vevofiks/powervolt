const express = require('express');
const vendorController = require('../controllers/vendor.controller');

const router = express.Router();

router
  .route('/')
  .post(vendorController.createVendor)
  .get(vendorController.getAllVendors);

router
  .route('/:id')
  .get(vendorController.getVendorById)
  .put(vendorController.updateVendor)
  .delete(vendorController.deleteVendor);

module.exports = router;
