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
'https://powervolt-lilac.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174'
];

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (mobile apps, postman, curl)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`CORS not allowed for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200, // some legacy browsers choke on 204
};

// ─────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────

// CORS must come BEFORE helmet so preflight OPTIONS responses
// carry the correct Access-Control-Allow-Origin header.
app.use(cors(corsOptions));

// Explicitly handle preflight for every route so OPTIONS requests
// are short-circuited before any other middleware can interfere.
app.options('*', cors(corsOptions));

app.use(
  helmet({
    crossOriginResourcePolicy: false,
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
// CORS Error Handler (must be before global error handler)
// When an origin is rejected, cors() calls next(err). Without
// this, the global errorHandler sends a response with NO
// Access-Control-Allow-Origin header, which the browser flags
// as a CORS failure even though it's actually a 403.
// ─────────────────────────────────────────────────────────────

app.use((err, req, res, next) => {
  if (err.message && err.message.startsWith('CORS not allowed')) {
    return res.status(403).json({
      success: false,
      statusCode: 403,
      message: `Forbidden: ${err.message}`,
    });
  }
  next(err);
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