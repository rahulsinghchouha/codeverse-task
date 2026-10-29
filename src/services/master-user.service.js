const apiError = require('../utils/api-error');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const defaultCreateMasterUserRepository = require('../repositories/master-user.repository');
const { getTenantConnection: defaultGetTenantConnection } = require('../config/tenant-db');

/**
 * @param {import('../interfaces/master-repository.interface').MasterRepository} masterRepository
 *   needed only to resolve a masterSlug -> tenant dbName at login time
 * @param {{ getTenantConnection?: Function, buildRepository?: Function }} deps injection point for tests
 */
function createMasterUserService(masterRepository, deps = {}) {
  const {
    getTenantConnection = defaultGetTenantConnection,
    buildRepository = defaultCreateMasterUserRepository,
  } = deps;

  async function createUser(dbName, masterId, { name, email, password }) {
    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);

    const existing = await repository.findByEmail(email);
    if (existing) {
      throw apiError.badRequest('A user with this email already exists');
    }

    const passwordHash = await hashPassword(password);
    return repository.create({ name, email, passwordHash, masterId });
  }

  async function listUsers(dbName) {
    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);
    return repository.findAll();
  }

  // masterSlug identifies which tenant DB to check credentials against,
  // before any token exists — the multi-tenant equivalent of a subdomain.
  async function login({ masterSlug, email, password }) {
    const master = await masterRepository.findBySlug(masterSlug);
    if (!master) {
      throw apiError.badRequest('Invalid master, email, or password');
    }

    const connection = await getTenantConnection(master.dbName);
    const repository = buildRepository(connection);
    const user = await repository.findByEmail(email);
    if (!user) {
      throw apiError.badRequest('Invalid master, email, or password');
    }

    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      throw apiError.badRequest('Invalid master, email, or password');
    }

    const token = signToken({
      type: 'masterUser',
      id: user._id.toString(),
      masterId: master._id.toString(),
      dbName: master.dbName,
    });
    return { token };
  }

  async function getProfile(dbName, userId) {
    const connection = await getTenantConnection(dbName);
    const repository = buildRepository(connection);
    const user = await repository.findById(userId);
    if (!user) {
      throw apiError.notFound('User not found');
    }
    return user;
  }

  return { createUser, listUsers, login, getProfile };
}

module.exports = createMasterUserService;
