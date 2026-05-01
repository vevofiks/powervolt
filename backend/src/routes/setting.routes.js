const router = require('express').Router();
const controller = require('../controllers/setting.controller');

router.get('/', controller.getSettings);
router.get('/backup', controller.exportBackup);
router.put('/', controller.updateSettings);

module.exports = router;
