const router = require('express').Router();
const { pingDatabase, pingServer } = require('../utils/dbKeepAlive');

const handleRefresh = async (req, res) => {
  const dbResult = await pingDatabase();
  
  // Optional server self-ping if target URL provided or configured
  const serverUrl = req.query.url || process.env.BACKEND_URL || process.env.SERVER_URL;
  let serverResult = null;
  
  if (serverUrl) {
    serverResult = await pingServer(serverUrl);
  }

  if (dbResult.success) {
    return res.json({
      success: true,
      statusCode: 200,
      message: dbResult.message,
      dbDurationMs: dbResult.durationMs,
      serverPing: serverResult,
      timestamp: dbResult.timestamp
    });
  } else {
    return res.status(500).json({
      success: false,
      statusCode: 500,
      message: 'Failed to refresh database connection',
      error: dbResult.message,
      timestamp: dbResult.timestamp
    });
  }
};

router.get('/refresh', handleRefresh);
router.post('/refresh', handleRefresh);
router.get('/status', handleRefresh);

router.get('/ping-server', async (req, res) => {
  const port = process.env.PORT || 5000;
  const targetUrl = req.query.url || process.env.BACKEND_URL || `http://localhost:${port}/health`;
  const result = await pingServer(targetUrl);
  res.json({ success: result.success, result });
});

module.exports = router;
