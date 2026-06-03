const router = require('express').Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth');

router.post('/login', authController.login);
router.get('/verify', authMiddleware, authController.verify);

module.exports = router;
