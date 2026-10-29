/**
 * @typedef {Object} MasterUserRepository
 * @property {(userData: object) => Promise<object>} create
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(email: string) => Promise<object|null>} findByEmail
 * @property {() => Promise<object[]>} findAll
 */

const REQUIRED_METHODS = ['create', 'findById', 'findByEmail', 'findAll'];

function assertIsMasterUserRepository(repository) {
  const missing = REQUIRED_METHODS.filter((method) => typeof repository[method] !== 'function');
  if (missing.length) {
    throw new Error(`Object is missing MasterUserRepository methods: ${missing.join(', ')}`);
  }
}

module.exports = { REQUIRED_METHODS, assertIsMasterUserRepository };
