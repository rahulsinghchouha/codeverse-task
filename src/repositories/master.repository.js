const MasterModel = require('../models/master.model');
const { omitPasswordHash } = require('../utils/sanitize');

/**
 * @returns {import('../interfaces/master-repository.interface').MasterRepository}
 */
function createMasterRepository() {
  return {
    async create(data) {
      const master = await MasterModel.create(data);
      return omitPasswordHash(master);
    },

    async findAll() {
      // select: 'email' keeps the populated SuperAdmin sub-document from
      // ever pulling in its own passwordHash in the first place.
      const masters = await MasterModel.find().populate({ path: 'createdBy', select: 'email' });
      return masters.map(omitPasswordHash);
    },

    // Raw doc (with passwordHash) — used internally for login only.
    async findByEmail(email) {
      return MasterModel.findOne({ email });
    },

    async findBySlug(slug) {
      return MasterModel.findOne({ slug });
    },
  };
}

module.exports = createMasterRepository;
