const router = require('express').Router();
const controller = require('../controllers/workSite.controller');

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Site Specific
router.post('/:id/assign-staff', controller.assignWorkers);
router.delete('/:id/staff/:workerId', controller.removeWorker);
router.post('/:id/work-entries', controller.addWorkEntry);
router.delete('/work-entries/:entryId', controller.deleteWorkEntry);

module.exports = router;
