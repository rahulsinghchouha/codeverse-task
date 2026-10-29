const jwt = require('jsonwebtoken');
const createMasterUserService = require('../../src/services/master-user.service');
const { hashPassword } = require('../../src/utils/password');
const { jwtSecret } = require('../../src/config/env');

function createFakeMasterRepository(seed = []) {
  const masters = [...seed];
  return {
    async findBySlug(slug) {
      return masters.find((m) => m.slug === slug) || null;
    },
  };
}

function createFakeTenantUserRepository(seed = []) {
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
    async findAll() {
      return users;
    },
  };
}

describe('createMasterUserService', () => {
  test('creates a user scoped to the resolved tenant connection', async () => {
    const masterRepository = createFakeMasterRepository();
    const tenantRepo = createFakeTenantUserRepository();
    const getTenantConnection = jest.fn().mockResolvedValue({ dbName: 'tenant_a' });
    const buildRepository = jest.fn().mockReturnValue(tenantRepo);
    const service = createMasterUserService(masterRepository, { getTenantConnection, buildRepository });

    const user = await service.createUser('tenant_a', 'master-1', {
      name: 'Bob',
      email: 'bob@acme.com',
      password: 'secret123',
    });

    expect(user.email).toBe('bob@acme.com');
    expect(user.masterId).toBe('master-1');
    expect(getTenantConnection).toHaveBeenCalledWith('tenant_a');
  });

  test('rejects login against a masterSlug that does not exist', async () => {
    const masterRepository = createFakeMasterRepository();
    const service = createMasterUserService(masterRepository);

    await expect(
      service.login({ masterSlug: 'ghost', email: 'bob@acme.com', password: 'secret123' })
    ).rejects.toThrow('Invalid master, email, or password');
  });

  test('logs in a master-user resolved via masterSlug and issues a masterUser-typed, tenant-scoped token', async () => {
    const passwordHash = await hashPassword('secret123');
    const master = { slug: 'acme-co', dbName: 'codevere_tenant_acme-co', _id: { toString: () => 'm1' } };
    const masterRepository = createFakeMasterRepository([master]);
    const tenantRepo = createFakeTenantUserRepository([
      { _id: { toString: () => 'u1' }, email: 'bob@acme.com', passwordHash },
    ]);
    const buildRepository = jest.fn().mockReturnValue(tenantRepo);
    const getTenantConnection = jest.fn().mockResolvedValue({});
    const service = createMasterUserService(masterRepository, { getTenantConnection, buildRepository });

    const { token } = await service.login({
      masterSlug: 'acme-co',
      email: 'bob@acme.com',
      password: 'secret123',
    });
    const payload = jwt.verify(token, jwtSecret);

    expect(payload.type).toBe('masterUser');
    expect(payload.dbName).toBe('codevere_tenant_acme-co');
    expect(getTenantConnection).toHaveBeenCalledWith('codevere_tenant_acme-co');
  });
});
