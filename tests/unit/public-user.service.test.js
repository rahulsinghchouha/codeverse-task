const createPublicUserService = require('../../src/services/public-user.service');
const { hashPassword } = require('../../src/utils/password');

function createFakeRepository(seed = []) {
  const users = [...seed];
  return {
    async create(data) {
      const user = { _id: { toString: () => String(users.length + 1) }, ...data };
      users.push(user);
      return user;
    },
    async findByEmail(email) {
      return users.find((u) => u.email === email) || null;
    },
    async findById(id) {
      return users.find((u) => u._id.toString() === id) || null;
    },
  };
}

describe('createPublicUserService', () => {
  test('signs up a new public user', async () => {
    const service = createPublicUserService(createFakeRepository());
    const user = await service.signup({ name: 'Ada', email: 'ada@example.com', password: 'secret123' });
    expect(user.email).toBe('ada@example.com');
  });

  test('rejects signup with an email already taken', async () => {
    const service = createPublicUserService(
      createFakeRepository([{ id: '1', email: 'ada@example.com' }])
    );
    await expect(
      service.signup({ name: 'Ada', email: 'ada@example.com', password: 'secret123' })
    ).rejects.toThrow('A user with this email already exists');
  });

  test('logs in with correct credentials and issues a publicUser-typed token', async () => {
    const passwordHash = await hashPassword('secret123');
    const service = createPublicUserService(
      createFakeRepository([{ _id: { toString: () => '1' }, email: 'ada@example.com', passwordHash }])
    );

    const { token } = await service.login({ email: 'ada@example.com', password: 'secret123' });
    const jwt = require('jsonwebtoken');
    const { jwtSecret } = require('../../src/config/env');
    const payload = jwt.verify(token, jwtSecret);

    expect(payload.type).toBe('publicUser');
  });

  test('throws not found for a missing profile', async () => {
    const service = createPublicUserService(createFakeRepository());
    await expect(service.getProfile('missing')).rejects.toThrow('User not found');
  });
});
