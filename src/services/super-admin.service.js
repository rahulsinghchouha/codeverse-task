const apiError = require('../utils/api-error');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

/**
 * @param {ReturnType<typeof import('../repositories/super-admin.repository')>} superAdminRepository
 */
function createSuperAdminService(superAdminRepository) {
  async function login({ email, password }) {
    console.log('[super-admin.service] login: looking up email', email);
    const superAdmin = await superAdminRepository.findByEmail(email);
    if (!superAdmin) {
      console.log('[super-admin.service] login: no superadmin with that email');
      throw apiError.badRequest('Invalid email or password');
    }
    const matches = await comparePassword(password, superAdmin.passwordHash);
    console.log('[super-admin.service] login: password matches?', matches);
    if (!matches) {
      throw apiError.badRequest('Invalid email or password');
    }
    const token = signToken({ type: 'superadmin', id: superAdmin._id.toString() });
    console.log('[super-admin.service] login: issuing token for id', superAdmin._id.toString());
    return { token };
  }

  // Called once at server startup; a no-op once a superadmin already exists.
  async function ensureSeeded(email, plainPassword) {
    const count = await superAdminRepository.count();
    if (count > 0) return;
    const passwordHash = await hashPassword(plainPassword);
    await superAdminRepository.create({ email, passwordHash });
  }

  return { login, ensureSeeded };
}

module.exports = createSuperAdminService;
