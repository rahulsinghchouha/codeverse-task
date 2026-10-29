function createApiError(statusCode, message, details = null) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

function badRequest(message, details) {
  return createApiError(400, message, details);
}

function notFound(message) {
  return createApiError(404, message);
}

function internal(message) {
  return createApiError(500, message);
}

module.exports = { createApiError, badRequest, notFound, internal };
