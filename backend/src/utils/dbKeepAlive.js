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
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Database keep-alive ping failed:', error.message);
    return {
      success: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Perform an HTTP GET ping to keep the backend server awake (useful for Render/Vercel/cloud hosts).
 * @param {string} targetUrl - Full URL to ping (e.g., https://your-app.onrender.com/health)
 * @returns {Promise<{success: boolean, statusCode?: number, durationMs?: number, timestamp: string}>}
 */
const pingServer = (targetUrl) => {
  return new Promise((resolve) => {
    if (!targetUrl) return resolve({ success: false, message: 'No target URL provided' });
    const client = targetUrl.startsWith('https') ? https : http;
    const start = process.hrtime();
    
    client.get(targetUrl, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const elapsed = process.hrtime(start);
        const durationMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(2);
        resolve({
          success: res.statusCode === 200,
          statusCode: res.statusCode,
          durationMs: parseFloat(durationMs),
          timestamp: new Date().toISOString()
        });
      });
    }).on('error', (err) => {
      resolve({
        success: false,
        message: err.message,
        timestamp: new Date().toISOString()
      });
    });
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
 * Start recurring server self-ping to prevent free-tier web hosting (e.g. Render) from spinning down.
 * @param {string} serverUrl - Server health URL to ping
 * @param {number} intervalMs - Interval in milliseconds (default 240000 = 4 mins)
 */
const startServerSelfPing = (serverUrl, intervalMs = 240000) => {
  const url = serverUrl || process.env.BACKEND_URL || process.env.SERVER_URL;
  if (!url) return;

  if (serverKeepAliveInterval) {
    clearInterval(serverKeepAliveInterval);
  }

  console.log(`📡 Backend Server Self-Ping started for: ${url}`);
  
  serverKeepAliveInterval = setInterval(async () => {
    const res = await pingServer(url);
    if (res.success) {
      console.log(`[${new Date().toLocaleTimeString()}] 📡 Server Self-Ping OK (${res.durationMs}ms)`);
    }
  }, intervalMs);

  if (serverKeepAliveInterval.unref) {
    serverKeepAliveInterval.unref();
  }
};

module.exports = {
  pingDatabase,
  pingServer,
  startDbKeepAlive,
  startServerSelfPing
};
