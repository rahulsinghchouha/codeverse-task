const apiError = require('../utils/api-error');

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isEmail(value) {
  return isNonEmptyString(value) && value.includes('@');
}

function minLength(n) {
  return (value) => typeof value === 'string' && value.length >= n;
}

// Shared by every feature's validator file: each one only supplies which
// fields/checks apply, so the field-loop + error-collection logic isn't
// re-typed per module. (SRP still holds: each *.validator.js owns its own
// field rules, this just owns the mechanics of running them.)
function validateFields(req, _res, next, checks) {
  const errors = [];
  for (const [field, check, message] of checks) {
    if (!check(req.body[field])) errors.push(message);
  }
  if (errors.length) return next(apiError.badRequest('Validation failed', errors));
  return next();
}

module.exports = { isNonEmptyString, isEmail, minLength, validateFields };
