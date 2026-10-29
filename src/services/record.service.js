const apiError = require('../utils/api-error');
const { getTenantConnection: defaultGetTenantConnection } = require('../config/tenant-db');
const defaultCreateRecordRepository = require('../repositories/record.repository');
const defaultCache = require('../config/redis');

const LIST_TTL_SECONDS = 60;

function cacheKey(dbName) {
  return `tenant:${dbName}:data:list`;
}

/**
 * @param {{ getTenantConnection?: Function, buildRepository?: Function, cache?: object }} deps
 *   injection point for tests — default to the real tenant pool / repository / redis client
 */
function createRecordService(deps = {}) {
  const {
    getTenantConnection = defaultGetTenantConnection,
    buildRepository = defaultCreateRecordRepository,
    cache = defaultCache,
  } = deps;

  async function createRecord(dbName, actor, { title, payload }) {
    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);
    const record = await repository.create({
      title,
      payload,
      createdByType: actor.type,
      createdById: actor.id,
    });
    await cache.del(cacheKey(dbName));
    return record;
  }

  async function listRecords(dbName) {
    const cached = await cache.getJson(cacheKey(dbName));
    if (cached) return cached;

    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);
    const records = await repository.findAll();
    await cache.setJson(cacheKey(dbName), records, LIST_TTL_SECONDS);
    return records;
  }

  async function getRecord(dbName, id) {
    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);
    const record = await repository.findById(id);
    if (!record) {
      throw apiError.notFound('Record not found');
    }
    return record;
  }

  async function updateRecord(dbName, id, updates) {
    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);
    const record = await repository.update(id, updates);
    if (!record) {
      throw apiError.notFound('Record not found');
    }
    await cache.del(cacheKey(dbName));
    return record;
  }

  async function deleteRecord(dbName, id) {
    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);
    const record = await repository.delete(id);
    if (!record) {
      throw apiError.notFound('Record not found');
    }
    await cache.del(cacheKey(dbName));
    return record;
  }

  return { createRecord, listRecords, getRecord, updateRecord, deleteRecord };
}

module.exports = createRecordService;
