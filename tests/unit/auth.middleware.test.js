const createAuthMiddleware = require('../../src/middlewares/auth.middleware');
const { signToken } = require('../../src/utils/jwt');

function runMiddleware(middleware, req) {
  return new Promise((resolve) => {
    middleware(req, {}, (err) => resolve(err));
  });
}

// This is the mechanism that keeps the four login systems (superadmin,
// master, masterUser, publicUser) from accepting each other's tokens, even
// though they're all signed with the same JWT secret.
describe('createAuthMiddleware (cross-login prevention)', () => {
  test('passes through and attaches req.auth for a matching type', async () => {
    const token = signToken({ type: 'masterUser', id: '1', dbName: 'tenant_a' });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const middleware = createAuthMiddleware('masterUser');

    const err = await runMiddleware(middleware, req);

    expect(err).toBeUndefined();
    expect(req.auth.type).toBe('masterUser');
    expect(req.auth.dbName).toBe('tenant_a');
  });

  test('rejects a correctly-signed token whose type does not match the route', async () => {
    const publicUserToken = signToken({ type: 'publicUser', id: '1' });
    const req = { headers: { authorization: `Bearer ${publicUserToken}` } };
    const middleware = createAuthMiddleware('masterUser');

    const err = await runMiddleware(middleware, req);

    expect(err).toBeDefined();
    expect(err.statusCode).toBe(403);
    expect(req.auth).toBeUndefined();
  });

  test('rejects a missing or malformed Authorization header', async () => {
    const middleware = createAuthMiddleware('master');

    const errMissing = await runMiddleware(middleware, { headers: {} });
    const errMalformed = await runMiddleware(middleware, { headers: { authorization: 'not-a-bearer-token' } });

    expect(errMissing.statusCode).toBe(401);
    expect(errMalformed.statusCode).toBe(401);
  });

  test('accepts any of several allowed types', async () => {
    const masterToken = signToken({ type: 'master', id: '1', dbName: 'tenant_a' });
    const req = { headers: { authorization: `Bearer ${masterToken}` } };
    const middleware = createAuthMiddleware(['master', 'masterUser']);

    const err = await runMiddleware(middleware, req);

    expect(err).toBeUndefined();
    expect(req.auth.type).toBe('master');
  });
});
