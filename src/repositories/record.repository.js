const { getRecordModel } = require('../models/record.model');

/**
 * @returns {import('../interfaces/record-repository.interface').RecordRepository}
 */
function createRecordRepository(connection) {
  const RecordModel = getRecordModel(connection);

  return {
    async create(data) {
      return RecordModel.create(data);
    },

    async findAll() {
      return RecordModel.find().sort({ createdAt: -1 });
    },

    async findById(id) {
      return RecordModel.findById(id);
    },

    async update(id, updates) {
      return RecordModel.findByIdAndUpdate(id, updates, { new: true });
    },

    async delete(id) {
      return RecordModel.findByIdAndDelete(id);
    },
  };
}

module.exports = createRecordRepository;
