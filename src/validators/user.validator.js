const apiError = require('../utils/api-error');

/**
 * Pure input validation, kept separate from the controller and service
 * so each file has a single reason to change. (SRP)
 */
function validateCreateUser(req, _res, next) {
  const { name, email } = req.body;
  const errors = [];

  if (!name || typeof name !== 'string') errors.push('name is required');
  if (!email || typeof email !== 'string' || !email.includes('@')) errors.push('a valid email is required');

  if (errors.length) {
    return next(apiError.badRequest('Validation failed', errors));
  }
  return next();
}

module.exports = { validateCreateUser };
