const router = require('express').Router();
const controller = require('../controllers/account.controller');

// Account CRUD
router.get('/summary', controller.getSummary);
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

// Ledger & Statement routes
router.get('/:id/ledger', controller.getLedger);
router.get('/:id/statement', controller.getStatement);
router.post('/:id/ledger', controller.addLedgerEntry);

module.exports = router;
