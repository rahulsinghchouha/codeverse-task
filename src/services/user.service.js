const apiError = require('../utils/api-error');

/**
 * Business logic for users. Depends on a userRepository object passed in
 * as a parameter rather than importing a concrete repository, so it is
 * open to new persistence strategies without modification (OCP) and
 * testable with any plain object that satisfies the repository shape (DIP).
 * @param {import('../interfaces/user-repository.interface').UserRepository} userRepository
 */
function createUserService(userRepository) {
  async function createUser(userData) {
    const existing = await userRepository.findByEmail(userData.email);
    if (existing) {
      throw apiError.badRequest('A user with this email already exists');
    }
    return userRepository.create(userData);
  }

  async function getUserById(id) {
    const user = await userRepository.findById(id);
    if (!user) {
      throw apiError.notFound('User not found');
    }
    return user;
  }

  async function listUsers() {
    return userRepository.findAll();
  }

  async function updateUser(id, updates) {
    const user = await userRepository.update(id, updates);
    if (!user) {
      throw apiError.notFound('User not found');
    }
    return user;
  }

  async function deleteUser(id) {
    const user = await userRepository.delete(id);
    if (!user) {
      throw apiError.notFound('User not found');
    }
    return user;
  }

  return { createUser, getUserById, listUsers, updateUser, deleteUser };
}

module.exports = createUserService;
