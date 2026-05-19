const vendorService = require('../services/vendor.service');
const { catchAsync } = require('../utils/catchAsync');

const createVendor = catchAsync(async (req, res) => {
  const vendor = await vendorService.createVendor(req.body);
  res.status(201).json({
    success: true,
    data: vendor,
  });
});

const getAllVendors = catchAsync(async (req, res) => {
  const { search } = req.query;
  const vendors = await vendorService.getAllVendors(search);
  res.status(200).json({
    success: true,
    data: vendors,
  });
});

const getVendorById = catchAsync(async (req, res) => {
  const vendor = await vendorService.getVendorById(req.params.id);
  res.status(200).json({
    success: true,
    data: vendor,
  });
});

const updateVendor = catchAsync(async (req, res) => {
  const vendor = await vendorService.updateVendor(req.params.id, req.body);
  res.status(200).json({
    success: true,
    data: vendor,
  });
});

const deleteVendor = catchAsync(async (req, res) => {
  await vendorService.deleteVendor(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Vendor deleted successfully',
  });
});

module.exports = {
  createVendor,
  getAllVendors,
  getVendorById,
  updateVendor,
  deleteVendor,
};
