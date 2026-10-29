/**
 * Shape that any user persistence implementation must satisfy. UserService
 * depends on this shape, not on a concrete database driver, so the storage
 * layer can be swapped (Mongoose, Postgres, in-memory test double) without
 * changing business logic. (Dependency Inversion)
 *
 * @typedef {Object} UserRepository
 * @property {(userData: object) => Promise<object>} create
 * @property {(id: string) => Promise<object|null>} findById
 * @property {(email: string) => Promise<object|null>} findByEmail
 * @property {() => Promise<object[]>} findAll
 * @property {(id: string, updates: object) => Promise<object|null>} update
 * @property {(id: string) => Promise<object|null>} delete
 */

const REQUIRED_METHODS = ['create', 'findById', 'findByEmail', 'findAll', 'update', 'delete'];

// Runtime check used in tests/wiring to confirm a fake or real repository
// satisfies the UserRepository shape above, in place of a class contract.
function assertIsUserRepository(repository) {
  const missing = REQUIRED_METHODS.filter((method) => typeof repository[method] !== 'function');
  if (missing.length) {
    throw new Error(`Object is missing UserRepository methods: ${missing.join(', ')}`);
  }
}

module.exports = { REQUIRED_METHODS, assertIsUserRepository };
