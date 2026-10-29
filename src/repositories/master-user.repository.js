const { getMasterUserModel } = require('../models/master-user.model');
const { omitPasswordHash } = require('../utils/sanitize');

/**
 * Factory takes the already-resolved tenant connection (not a dbName) so it
 * stays a pure "talk to this connection's MasterUser collection" object —
 * resolving *which* tenant connection is the service's job.
 * @returns {import('../interfaces/master-user-repository.interface').MasterUserRepository}
 */
function createMasterUserRepository(connection) {
  const MasterUserModel = getMasterUserModel(connection);

  return {
    async create(userData) {
      const user = await MasterUserModel.create(userData);
      return omitPasswordHash(user);
    },

    async findById(id) {
      const user = await MasterUserModel.findById(id);
      return omitPasswordHash(user);
    },

    // Raw doc (with passwordHash) — used internally for login only.
    async findByEmail(email) {
      return MasterUserModel.findOne({ email });
    },

    async findAll() {
      const users = await MasterUserModel.find();
      return users.map(omitPasswordHash);
    },
  };
}

module.exports = createMasterUserRepository;
