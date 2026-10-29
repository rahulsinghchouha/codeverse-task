const logger = require('../utils/logger');

// Single place responsible for turning any error into an HTTP response. (SRP)
function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  if (statusCode >= 500) {
    logger.error(err);
  }
  res.status(statusCode).json({
    message: err.message || 'Internal server error',
    details: err.details || undefined,
  });
}

module.exports = errorHandler;
