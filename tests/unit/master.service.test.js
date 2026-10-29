const jwt = require('jsonwebtoken');
const createMasterService = require('../../src/services/master.service');
const { hashPassword } = require('../../src/utils/password');
const { jwtSecret } = require('../../src/config/env');

function createFakeMasterRepository(seed = []) {
  const masters = [...seed];
  return {
    async create(data) {
      const master = { _id: { toString: () => String(masters.length + 1) }, ...data };
      masters.push(master);
      // Mirrors the real repository's contract: create() never hands the
      // passwordHash back out, only findByEmail (used internally for auth) does.
      const { passwordHash, ...safe } = master;
      return safe;
    },
    async findAll() {
      return masters;
    },
    async findByEmail(email) {
      return masters.find((m) => m.email === email) || null;
    },
    async findBySlug(slug) {
      return masters.find((m) => m.slug === slug) || null;
    },
  };
}

describe('createMasterService', () => {
  test('creates a master, derives its slug/dbName, and opens its tenant connection', async () => {
    const repository = createFakeMasterRepository();
    const opened = [];
    const getTenantConnection = async (dbName) => {
      opened.push(dbName);
      return { dbName };
    };
    const service = createMasterService(repository, { getTenantConnection });

    const master = await service.createMaster(
      { name: 'Acme Co', email: 'owner@acme.com', password: 'secret123' },
      'superadmin-1'
    );

    expect(master.slug).toBe('acme-co');
    expect(master.dbName).toBe('codevere_tenant_acme-co');
    expect(master.createdBy).toBe('superadmin-1');
    expect(master.passwordHash).toBeUndefined(); // never leaked back out
    expect(opened).toContain('codevere_tenant_acme-co');
  });

  test('rejects a duplicate master email', async () => {
    const existing = { email: 'owner@acme.com', slug: 'other', dbName: 'x' };
    const repository = createFakeMasterRepository([existing]);
    const service = createMasterService(repository, { getTenantConnection: async () => ({}) });

    await expect(
      service.createMaster({ name: 'Acme Co', email: 'owner@acme.com', password: 'secret123' })
    ).rejects.toThrow('A master with this email already exists');
  });

  test('logs in with correct credentials and issues a master-typed, tenant-scoped token', async () => {
    const passwordHash = await hashPassword('secret123');
    const existing = {
      _id: { toString: () => '1' },
      email: 'owner@acme.com',
      passwordHash,
      dbName: 'codevere_tenant_acme-co',
    };
    const repository = createFakeMasterRepository([existing]);
    const service = createMasterService(repository);

    const { token } = await service.login({ email: 'owner@acme.com', password: 'secret123' });
    const payload = jwt.verify(token, jwtSecret);

    expect(payload.type).toBe('master');
    expect(payload.dbName).toBe('codevere_tenant_acme-co');
  });

  test('rejects an incorrect password', async () => {
    const passwordHash = await hashPassword('secret123');
    const existing = { email: 'owner@acme.com', passwordHash, dbName: 'x' };
    const repository = createFakeMasterRepository([existing]);
    const service = createMasterService(repository);

    await expect(service.login({ email: 'owner@acme.com', password: 'wrong' })).rejects.toThrow(
      'Invalid email or password'
    );
  });
});
