const settingService = require('../services/setting.service');
const ApiResponse = require('../utils/ApiResponse');

const getSettings = async (req, res, next) => {
  try {
    const data = await settingService.get();
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const data = await settingService.update(req.body);
    res.json(ApiResponse.success(data, 'Settings updated successfully'));
  } catch (error) {
    next(error);
  }
};

const exportBackup = async (req, res, next) => {
  try {
    const data = await settingService.exportBackup();
    res.json(ApiResponse.success(data));
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings, exportBackup };
