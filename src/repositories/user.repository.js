const UserModel = require('../models/user.model');

/**
 * Concrete Mongoose implementation of the UserRepository shape.
 * Only responsible for translating persistence calls to/from Mongoose. (SRP)
 * @returns {import('../interfaces/user-repository.interface').UserRepository}
 */
function createUserRepository() {
  return {
    async create(userData) {
      return UserModel.create(userData);
    },

    async findById(id) {
      return UserModel.findById(id);
    },

    async findByEmail(email) {
      return UserModel.findOne({ email });
    },

    async findAll() {
      return UserModel.find();
    },

    async update(id, updates) {
      return UserModel.findByIdAndUpdate(id, updates, { new: true });
    },

    async delete(id) {
      return UserModel.findByIdAndDelete(id);
    },
  };
}

module.exports = createUserRepository;
