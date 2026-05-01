const router = require('express').Router();
const controller = require('../controllers/report.controller');

router.get('/profit-loss', controller.getProfitLoss);
router.get('/inventory', controller.getInventoryReport);

module.exports = router;
