const apiError = require('../utils/api-error');
const { verifyToken } = require('../utils/jwt');

/**
 * Returns middleware that accepts only a token whose `type` claim matches
 * one of allowedTypes exactly. A publicUser token is syntactically valid and
 * signed with the same secret as a masterUser token, but it will never pass
 * a middleware built with allowedTypes = ['masterUser'] — this is the
 * mechanism that keeps the separate login systems from crossing over.
 * @param {string|string[]} allowedTypes
 */
function createAuthMiddleware(allowedTypes) {
  const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

  return function authenticate(req, _res, next) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      return next(apiError.createApiError(401, 'Missing or malformed Authorization header'));
    }

    try {
      const payload = verifyToken(token);
      if (!types.includes(payload.type)) {
        return next(apiError.createApiError(403, 'Token is not authorized for this resource'));
      }
      req.auth = payload;
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = createAuthMiddleware;
