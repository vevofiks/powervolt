const router = require('express').Router();
const workerController = require('../controllers/worker.controller');

router.get('/', workerController.getAll);
router.get('/:id', workerController.getById);
router.post('/', workerController.create);
router.put('/:id', workerController.update);
router.delete('/:id', workerController.remove);

module.exports = router;
