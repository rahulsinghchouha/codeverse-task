/**
 * @typedef {Object} PublicUserRepository
 * @property {(userData: object) => Promise<object>} create
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(email: string) => Promise<object|null>} findByEmail
 */

const REQUIRED_METHODS = ['create', 'findById', 'findByEmail'];

function assertIsPublicUserRepository(repository) {
  const missing = REQUIRED_METHODS.filter((method) => typeof repository[method] !== 'function');
  if (missing.length) {
    throw new Error(`Object is missing PublicUserRepository methods: ${missing.join(', ')}`);
  }
}

module.exports = { REQUIRED_METHODS, assertIsPublicUserRepository };
