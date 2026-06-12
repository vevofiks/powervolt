const reportService = require('../services/report.service');
const ApiResponse = require('../utils/ApiResponse');

const getProfitLoss = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getProfitLoss(startDate, endDate);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getInventoryReport = async (req, res, next) => {
  try {
    const data = await reportService.getInventoryReport();
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const getGstReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const data = await reportService.getGstReport(startDate, endDate);
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfitLoss, getInventoryReport, getGstReport };
