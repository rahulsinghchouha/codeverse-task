/**
 * @typedef {Object} MasterRepository
 * @property {(data: object) => Promise<object>} create
 * @property {() => Promise<object[]>} findAll
 * @property {(email: string) => Promise<object|null>} findByEmail
 * @property {(slug: string) => Promise<object|null>} findBySlug
 */

const REQUIRED_METHODS = ['create', 'findAll', 'findByEmail', 'findBySlug'];

function assertIsMasterRepository(repository) {
  const missing = REQUIRED_METHODS.filter((method) => typeof repository[method] !== 'function');
  if (missing.length) {
    throw new Error(`Object is missing MasterRepository methods: ${missing.join(', ')}`);
  }
}

module.exports = { REQUIRED_METHODS, assertIsMasterRepository };
