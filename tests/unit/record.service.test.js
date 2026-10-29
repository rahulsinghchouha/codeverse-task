const createRecordService = require('../../src/services/record.service');

function createFakeCache() {
  const store = new Map();
  return {
    async getJson(key) {
      return store.has(key) ? store.get(key) : null;
    },
    async setJson(key, value) {
      store.set(key, value);
    },
    async del(key) {
      store.delete(key);
    },
    store,
  };
}

function createFakeRecordRepository(seed = []) {
  const records = [...seed];
  return {
    async create(data) {
      const record = { id: String(records.length + 1), ...data };
      records.push(record);
      return record;
    },
    async findAll() {
      return records;
    },
    async findById(id) {
      return records.find((r) => r.id === id) || null;
    },
    async update(id, updates) {
      const record = records.find((r) => r.id === id);
      if (!record) return null;
      Object.assign(record, updates);
      return record;
    },
    async delete(id) {
      const index = records.findIndex((r) => r.id === id);
      if (index === -1) return null;
      return records.splice(index, 1)[0];
    },
  };
}

describe('createRecordService', () => {
  test('serves the second list read from the per-tenant cache', async () => {
    const cache = createFakeCache();
    const repository = createFakeRecordRepository([{ id: '1', title: 'First' }]);
    const buildRepository = jest.fn().mockReturnValue(repository);
    const service = createRecordService({
      getTenantConnection: jest.fn().mockResolvedValue({}),
      buildRepository,
      cache,
    });

    await service.listRecords('tenant_a');
    await service.listRecords('tenant_a');

    expect(buildRepository).toHaveBeenCalledTimes(1);
  });

  test('invalidates the tenant cache key on create', async () => {
    const cache = createFakeCache();
    const repository = createFakeRecordRepository();
    const service = createRecordService({
      getTenantConnection: jest.fn().mockResolvedValue({}),
      buildRepository: jest.fn().mockReturnValue(repository),
      cache,
    });

    await service.listRecords('tenant_a');
    expect(cache.store.has('tenant:tenant_a:data:list')).toBe(true);

    await service.createRecord('tenant_a', { type: 'master', id: 'm1' }, { title: 'New', payload: {} });

    expect(cache.store.has('tenant:tenant_a:data:list')).toBe(false);
  });

  test('throws not found when updating a record that does not exist', async () => {
    const cache = createFakeCache();
    const repository = createFakeRecordRepository();
    const service = createRecordService({
      getTenantConnection: jest.fn().mockResolvedValue({}),
      buildRepository: jest.fn().mockReturnValue(repository),
      cache,
    });

    await expect(service.updateRecord('tenant_a', 'missing', { title: 'x' })).rejects.toThrow(
      'Record not found'
    );
  });
});
