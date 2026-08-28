const router = require('express').Router();
const { pingDatabase } = require('../utils/dbKeepAlive');

/**
 * GET /api/health
 * Lightweight health check endpoint.
 * Returns immediately without database dependency.
 */
router.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'power-volt-api',
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/health/db
 * Database health check endpoint.
 * Performs a ping query to verify PostgreSQL database connectivity and response time.
 */
router.get('/db', async (_req, res) => {
  const dbResult = await pingDatabase();
  const statusCode = dbResult.success ? 200 : 503;

  res.status(statusCode).json({
    status: dbResult.success ? 'ok' : 'error',
    service: 'power-volt-api',
    database: dbResult.success ? 'connected' : 'disconnected',
    dbDurationMs: dbResult.durationMs || null,
    message: dbResult.message,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
