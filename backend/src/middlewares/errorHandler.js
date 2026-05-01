const ApiError = require('../utils/ApiError');

/**
 * Global error handling middleware.
 */
const errorHandler = (err, _req, res, _next) => {
  let error = err;

  // If not an ApiError, wrap it
  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    error = new ApiError(statusCode, message, [], err.stack);
  }

  const response = {
    success: false,
    statusCode: error.statusCode,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
    ...(error.errors.length > 0 && { errors: error.errors }),
  };

  console.error(`[ERROR] ${error.statusCode} - ${error.message}`);

  return res.status(error.statusCode).json(response);
};

module.exports = { errorHandler };
