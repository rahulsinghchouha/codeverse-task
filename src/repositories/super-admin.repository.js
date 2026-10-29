const SuperAdminModel = require('../models/super-admin.model');

function createSuperAdminRepository() {
  return {
    async create(data) {
      return SuperAdminModel.create(data);
    },

    async findByEmail(email) {
      return SuperAdminModel.findOne({ email });
    },

    async count() {
      return SuperAdminModel.countDocuments();
    },
  };
}

module.exports = createSuperAdminRepository;
