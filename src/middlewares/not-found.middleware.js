const apiError = require('../utils/api-error');

function notFoundHandler(req, _res, next) {
  next(apiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

module.exports = notFoundHandler;
