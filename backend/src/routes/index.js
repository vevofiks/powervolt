const router = require('express').Router();
const authMiddleware = require('../middlewares/auth');

// ─── Public Auth Routes ───────────────────────────────────────
router.use('/auth', require('./auth.routes'));

// ─── Protected Business Routes ────────────────────────────────
router.use('/dashboard', authMiddleware, require('./dashboard.routes'));
router.use('/sales-invoices', authMiddleware, require('./salesInvoice.routes'));
router.use('/service-invoices', authMiddleware, require('./serviceInvoice.routes'));
router.use('/customers', authMiddleware, require('./customer.routes'));
router.use('/products', authMiddleware, require('./product.routes'));
router.use('/accounts', authMiddleware, require('./account.routes'));
router.use('/expenses', authMiddleware, require('./expense.routes'));
router.use('/work-sites', authMiddleware, require('./workSite.routes'));
router.use('/workers', authMiddleware, require('./worker.routes'));
router.use('/salaries', authMiddleware, require('./salary.routes'));
router.use('/reports', authMiddleware, require('./report.routes'));
router.use('/settings', authMiddleware, require('./setting.routes'));
router.use('/vendors', authMiddleware, require('./vendor.routes'));
router.use('/purchase-bills', authMiddleware, require('./purchaseBill.routes'));

module.exports = router;

