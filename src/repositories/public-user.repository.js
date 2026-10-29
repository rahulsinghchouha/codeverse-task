const PublicUserModel = require('../models/public-user.model');
const { omitPasswordHash } = require('../utils/sanitize');

/**
 * @returns {import('../interfaces/public-user-repository.interface').PublicUserRepository}
 */
function createPublicUserRepository() {
  return {
    async create(userData) {
      const user = await PublicUserModel.create(userData);
      return omitPasswordHash(user);
    },

    async findById(id) {
      const user = await PublicUserModel.findById(id);
      return omitPasswordHash(user);
    },

    // Raw doc (with passwordHash) — used internally for login only.
    async findByEmail(email) {
      return PublicUserModel.findOne({ email });
    },
  };
}

module.exports = createPublicUserRepository;
