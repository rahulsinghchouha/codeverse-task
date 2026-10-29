const createUserService = require('../../src/services/user.service');

// A fake repository satisfying the UserRepository shape - no database
// needed because UserService depends on that shape, not a concrete
// implementation. (DIP, LSP)
function createFakeRepository(seed = []) {
  const users = [...seed];
  return {
    async create(data) {
      const user = { id: String(users.length + 1), ...data };
      users.push(user);
      return user;
    },
    async findByEmail(email) {
      return users.find((u) => u.email === email) || null;
    },
    async findById(id) {
      return users.find((u) => u.id === id) || null;
    },
    async findAll() {
      return users;
    },
  };
}

describe('createUserService', () => {
  test('creates a user when email is not taken', async () => {
    const service = createUserService(createFakeRepository());
    const user = await service.createUser({ name: 'Ada', email: 'ada@example.com' });
    expect(user.email).toBe('ada@example.com');
  });

  test('rejects duplicate emails', async () => {
    const service = createUserService(createFakeRepository([{ id: '1', email: 'ada@example.com' }]));
    await expect(
      service.createUser({ name: 'Ada', email: 'ada@example.com' })
    ).rejects.toThrow('A user with this email already exists');
  });

  test('throws not found for a missing user', async () => {
    const service = createUserService(createFakeRepository());
    await expect(service.getUserById('missing')).rejects.toThrow('User not found');
  });
});
