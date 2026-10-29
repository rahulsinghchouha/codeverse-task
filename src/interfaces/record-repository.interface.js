/**
 * @typedef {Object} RecordRepository
 * @property {(data: object) => Promise<object>} create
 * @property {() => Promise<object[]>} findAll
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(id: string, updates: object) => Promise<object|null>} update
 * @property {(id: string) => Promise<object|null>} delete
 */

const REQUIRED_METHODS = ['create', 'findAll', 'findById', 'update', 'delete'];

function assertIsRecordRepository(repository) {
  const missing = REQUIRED_METHODS.filter((method) => typeof repository[method] !== 'function');
  if (missing.length) {
    throw new Error(`Object is missing RecordRepository methods: ${missing.join(', ')}`);
  }
}

module.exports = { REQUIRED_METHODS, assertIsRecordRepository };
