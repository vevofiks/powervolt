const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const { errorHandler } = require('./middlewares/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────────────
// Allowed Frontend Origins
// ─────────────────────────────────────────────────────────────

const allowedOrigins = [
  'http://localhost:5173',
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

app.use(morgan('dev'));
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