const purchaseBillService = require('../services/purchaseBill.service');
const { catchAsync } = require('../utils/catchAsync');

const createBill = catchAsync(async (req, res) => {
  const bill = await purchaseBillService.createBill(req.body);
  res.status(201).json({
    success: true,
    data: bill,
  });
});

const getAllBills = catchAsync(async (req, res) => {
  const { search } = req.query;
  const bills = await purchaseBillService.getAllBills(search);
  res.status(200).json({
    success: true,
    data: bills,
  });
});

const getBillById = catchAsync(async (req, res) => {
  const bill = await purchaseBillService.getBillById(req.params.id);
  res.status(200).json({
    success: true,
    data: bill,
  });
});

const updatePaymentStatus = catchAsync(async (req, res) => {
  const bill = await purchaseBillService.updatePaymentStatus(req.params.id, req.body.paymentStatus);
  res.status(200).json({
    success: true,
    data: bill,
  });
});

const deleteBill = catchAsync(async (req, res) => {
  await purchaseBillService.deleteBill(req.params.id);
  res.status(200).json({
    success: true,
    message: 'Purchase bill deleted successfully',
  });
});

module.exports = {
  createBill,
  getAllBills,
  getBillById,
  updatePaymentStatus,
  deleteBill,
};
