const jwt = require('jsonwebtoken');
const { jwtSecret, jwtExpiresIn } = require('../config/env');
const apiError = require('./api-error');

// Every payload must carry a `type` claim (superadmin | master | masterUser |
// publicUser). Auth middleware checks it exactly, which is what keeps the
// separate login systems from accepting each other's tokens.
function signToken(payload, expiresIn = jwtExpiresIn) {
  return jwt.sign(payload, jwtSecret, { expiresIn });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, jwtSecret);
  } catch {
    throw apiError.createApiError(401, 'Invalid or expired token');
  }
}

module.exports = { signToken, verifyToken };
