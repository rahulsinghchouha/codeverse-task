const mongoose = require('mongoose');
const { mongoUri } = require('./env');
const logger = require('../utils/logger');

async function connectDatabase() {
  await mongoose.connect(mongoUri);
  logger.info('Database connected');
}

module.exports = { connectDatabase };
