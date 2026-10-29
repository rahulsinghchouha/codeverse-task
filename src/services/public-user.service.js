const apiError = require('../utils/api-error');
const { hashPassword, comparePassword } = require('../utils/password');
const { signToken } = require('../utils/jwt');

/**
 * @param {import('../interfaces/public-user-repository.interface').PublicUserRepository} publicUserRepository
 */
function createPublicUserService(publicUserRepository) {
  async function signup({ name, email, password }) {
    const existing = await publicUserRepository.findByEmail(email);
    if (existing) {
      throw apiError.badRequest('A user with this email already exists');
    }
    const passwordHash = await hashPassword(password);
    return publicUserRepository.create({ name, email, passwordHash });
  }

  async function login({ email, password }) {
    const user = await publicUserRepository.findByEmail(email);
    if (!user) {
      throw apiError.badRequest('Invalid email or password');
    }
    const matches = await comparePassword(password, user.passwordHash);
    if (!matches) {
      throw apiError.badRequest('Invalid email or password');
    }
    const token = signToken({ type: 'publicUser', id: user._id.toString() });
    return { token };
  }

  async function getProfile(id) {
    const user = await publicUserRepository.findById(id);
    if (!user) {
      throw apiError.notFound('User not found');
    }
    return user;
  }

  return { signup, login, getProfile };
}

module.exports = createPublicUserService;
