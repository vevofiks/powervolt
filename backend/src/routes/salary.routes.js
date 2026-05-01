const router = require('express').Router();
const salaryController = require('../controllers/salary.controller');

router.get('/draft', salaryController.calculateDraft);
router.get('/ledger/:workerId', salaryController.getLedger);
router.post('/payment', salaryController.paySalary);
router.post('/allowance', salaryController.addAllowance);
router.post('/deduction', salaryController.addDeduction);

module.exports = router;
