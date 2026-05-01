const dashboardService = require('../services/dashboard.service');
const ApiResponse = require('../utils/ApiResponse');

const getStats = async (req, res, next) => {
  try {
    const data = await dashboardService.getStats();
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

module.exports = { getStats };
