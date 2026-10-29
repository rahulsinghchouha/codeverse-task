const apiError = require('../utils/api-error');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');
const slugify = require('../utils/slugify');
const { getTenantConnection: defaultGetTenantConnection } = require('../config/tenant-db');

/**
 * @param {import('../interfaces/master-repository.interface').MasterRepository} masterRepository
 * @param {{ getTenantConnection?: Function }} deps injection point for tests
 */
function createMasterService(masterRepository, deps = {}) {
  const { getTenantConnection = defaultGetTenantConnection } = deps;

  async function createMaster({ name, email, password }, createdBySuperAdminId) {
    console.log('[master.service] createMaster: checking email', email);
    const existingEmail = await masterRepository.findByEmail(email);
    if (existingEmail) {
      throw apiError.badRequest('A master with this email already exists');
    }

    const slug = slugify(name);
    console.log('[master.service] createMaster: derived slug', slug);
    const existingSlug = await masterRepository.findBySlug(slug);
    if (existingSlug) {
      throw apiError.badRequest('A master with a conflicting name already exists');
    }

    const dbName = `codevere_tenant_${slug}`;
    const passwordHash = await hashPassword(password);
    console.log('[master.service] createMaster: creating registry row for dbName', dbName);
    const master = await masterRepository.create({
      name,
      slug,
      dbName,
      email,
      passwordHash,
      createdBy: createdBySuperAdminId,
    });

    // Open the tenant connection now, so the isolated database exists from
    // the moment the master is created rather than on its first login.
    console.log('[master.service] createMaster: opening tenant connection', dbName);
    await getTenantConnection(dbName);
    console.log('[master.service] createMaster: tenant connection ready, done');

    return master;
  }

  async function listMasters() {
    console.log('[master.service] listMasters: fetching all masters from central DB');
    const masters = await masterRepository.findAll();
    console.log('[master.service] listMasters: found', masters.length, 'master(s)');
    return masters;
  }

  async function login({ email, password }) {
    const master = await masterRepository.findByEmail(email);
    if (!master) {
      throw apiError.badRequest('Invalid email or password');
    }
    const matches = await comparePassword(password, master.passwordHash);
    if (!matches) {
      throw apiError.badRequest('Invalid email or password');
    }
    const token = signToken({
      type: 'master',
      id: master._id.toString(),
      masterId: master._id.toString(),
      dbName: master.dbName,
    });
    return { token };
  }

  return { createMaster, listMasters, login };
}

module.exports = createMasterService;
