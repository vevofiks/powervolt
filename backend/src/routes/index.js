const router = require('express').Router();

// ─── Mount All Routes ─────────────────────────────────────────
router.use('/dashboard', require('./dashboard.routes'));
router.use('/sales-invoices', require('./salesInvoice.routes'));
router.use('/service-invoices', require('./serviceInvoice.routes'));
router.use('/customers', require('./customer.routes'));
router.use('/products', require('./product.routes'));
router.use('/accounts', require('./account.routes'));
router.use('/expenses', require('./expense.routes'));
router.use('/work-sites', require('./workSite.routes'));
router.use('/workers', require('./worker.routes'));
router.use('/salaries', require('./salary.routes'));
router.use('/reports', require('./report.routes'));
router.use('/settings', require('./setting.routes'));
router.use('/vendors', require('./vendor.routes'));
router.use('/purchase-bills', require('./purchaseBill.routes'));

module.exports = router;
