const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;


const compression = require('compression');
app.use(compression());

// ─────────────────────────────────────────────────────────────
// Allowed Frontend Origins
// ─────────────────────────────────────────────────────────────

const allowedOrigins = [
  'http://localhost:5174',
  'https://powervolt-lilac.vercel.app',
];

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

app.use(
  helmet({
    crossOriginResourcePolicy: false,
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      // allow requests with no origin (mobile apps, postman, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('CORS not allowed'));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);

// ─── Performance Logging Middleware ───────────────────────────
app.use((req, res, next) => {
  const start = process.hrtime();
  
  res.on('finish', () => {
    const elapsed = process.hrtime(start);
    const durationInMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(3);
    
    // Log with color based on status
    let statusColor = '\x1b[32m'; // Green
    if (res.statusCode >= 400) statusColor = '\x1b[33m'; // Yellow
    if (res.statusCode >= 500) statusColor = '\x1b[31m'; // Red
    
    console.log(
      `[\x1b[36m${new Date().toLocaleTimeString()}\x1b[0m] ` +
      `${req.method} ${req.originalUrl} ` +
      `${statusColor}${res.statusCode}\x1b[0m ` +
      `\x1b[35m${durationInMs}ms\x1b[0m`
    );
  });
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────────────
// API Routes
// ─────────────────────────────────────────────────────────────

app.use('/api', routes);

// ─────────────────────────────────────────────────────────────
// Health Check
// ─────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// ─────────────────────────────────────────────────────────────
// Global Error Handler
// ─────────────────────────────────────────────────────────────

app.use(errorHandler);

// ─────────────────────────────────────────────────────────────
// Start Server
// ─────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`⚡ Power Volt API running on http://localhost:${PORT}`);
});

module.exports = app;