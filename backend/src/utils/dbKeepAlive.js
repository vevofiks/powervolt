const http = require('http');
const https = require('https');
const prisma = require('../models/prisma');

let dbKeepAliveInterval = null;
let serverKeepAliveInterval = null;

/**
 * Perform a lightweight query to refresh and keep the Neon database connection warm.
 * @returns {Promise<{success: boolean, durationMs: number, timestamp: string}>}
 */
const pingDatabase = async () => {
  const start = process.hrtime();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const elapsed = process.hrtime(start);
    const durationMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(2);
    
    return {
      success: true,
      message: 'Database connection is active and refreshed',
      durationMs: parseFloat(durationMs),
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('❌ Database keep-alive ping failed:', error.message);
    return {
      success: false,
      message: error.message,
      timestamp: new Date().toISOString(),
    };
  }
};

/**
 * Perform an HTTP GET ping to keep the backend server awake.
 * @param {string} targetUrl - Full URL to ping (e.g., https://your-api.onrender.com/api/health)
 * @returns {Promise<{success: boolean, statusCode?: number, durationMs?: number, message?: string, timestamp: string}>}
 */
const pingServer = (targetUrl) => {
  return new Promise((resolve) => {
    if (!targetUrl) return resolve({ success: false, message: 'No target URL provided' });

    try {
      const client = targetUrl.startsWith('https') ? https : http;
      const start = process.hrtime();

      const req = client.get(targetUrl, { timeout: 10000 }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const elapsed = process.hrtime(start);
          const durationMs = Math.round(elapsed[0] * 1000 + elapsed[1] / 1e6);
          const isSuccess = res.statusCode >= 200 && res.statusCode < 300;
          resolve({
            success: isSuccess,
            statusCode: res.statusCode,
            durationMs,
            message: isSuccess ? 'OK' : `HTTP ${res.statusCode}`,
            timestamp: new Date().toISOString(),
          });
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          success: false,
          message: 'connection timeout',
          timestamp: new Date().toISOString(),
        });
      });

      req.on('error', (err) => {
        resolve({
          success: false,
          message: err.message || 'network error',
          timestamp: new Date().toISOString(),
        });
      });
    } catch (err) {
      resolve({
        success: false,
        message: err.message || 'execution error',
        timestamp: new Date().toISOString(),
      });
    }
  });
};

/**
 * Start recurring background keep-alive ping to prevent Neon database auto-suspension.
 * Neon auto-suspends after 5 minutes of inactivity; default interval is 3.5 minutes (210,000 ms).
 * @param {number} intervalMs - Interval in milliseconds (default 210000)
 */
const startDbKeepAlive = (intervalMs = 210000) => {
  if (dbKeepAliveInterval) {
    clearInterval(dbKeepAliveInterval);
  }

  // Initial ping on start
  pingDatabase().then(res => {
    if (res.success) {
      console.log(`💚 Neon DB Keep-Alive initialized (pinged in ${res.durationMs}ms)`);
    }
  });

  dbKeepAliveInterval = setInterval(async () => {
    const res = await pingDatabase();
    if (res.success) {
      console.log(`[${new Date().toLocaleTimeString()}] 💚 Neon DB Keep-Alive ping OK (${res.durationMs}ms)`);
    }
  }, intervalMs);

  if (dbKeepAliveInterval.unref) {
    dbKeepAliveInterval.unref();
  }
};

/**
 * Initialize optional backend self-ping keep-alive mechanism.
 * Driven by environment variables:
 * - KEEP_ALIVE_ENABLED (default: false)
 * - BACKEND_URL (e.g. https://your-api.onrender.com)
 * - KEEP_ALIVE_INTERVAL_MS (default: 600000 = 10 minutes)
 * 
 * @returns {{ enabled: boolean, targetUrl?: string, intervalMs?: number }}
 */
const initKeepAlive = () => {
  const isEnabledStr = (process.env.KEEP_ALIVE_ENABLED || 'false').toLowerCase().trim();
  const enabled = isEnabledStr === 'true' || isEnabledStr === '1';

  if (!enabled) {
    return { enabled: false };
  }

  const baseUrl = (process.env.BACKEND_URL || process.env.SERVER_URL || '').trim();
  if (!baseUrl) {
    console.warn('[KEEP-ALIVE] Warning: KEEP_ALIVE_ENABLED is true, but BACKEND_URL is not configured.');
    return { enabled: false };
  }

  // Construct target URL to /api/health
  let targetUrl = baseUrl.replace(/\/$/, '');
  if (!targetUrl.endsWith('/api/health')) {
    if (targetUrl.endsWith('/health')) {
      targetUrl = targetUrl.replace(/\/health$/, '/api/health');
    } else {
      targetUrl += '/api/health';
    }
  }

  const parsedInterval = parseInt(process.env.KEEP_ALIVE_INTERVAL_MS, 10);
  const intervalMs = (!isNaN(parsedInterval) && parsedInterval > 0) ? parsedInterval : 600000;

  if (serverKeepAliveInterval) {
    clearInterval(serverKeepAliveInterval);
  }

  const executeHealthPing = async () => {
    try {
      const res = await pingServer(targetUrl);
      if (res.success) {
        console.log(`[KEEP-ALIVE] Health check successful: ${res.durationMs}ms`);
      } else {
        console.log(`[KEEP-ALIVE] Health check failed: ${res.message || 'connection timeout'}`);
      }
    } catch (err) {
      console.log(`[KEEP-ALIVE] Health check failed: ${err.message || 'connection timeout'}`);
    }
  };

  // Perform initial ping
  executeHealthPing();

  serverKeepAliveInterval = setInterval(executeHealthPing, intervalMs);

  if (serverKeepAliveInterval.unref) {
    serverKeepAliveInterval.unref();
  }

  return { enabled: true, targetUrl, intervalMs };
};

module.exports = {
  pingDatabase,
  pingServer,
  startDbKeepAlive,
  initKeepAlive,
};
