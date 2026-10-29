const mongoose = require('mongoose');
const { mongoHost } = require('./env');
const logger = require('../utils/logger');

// One cached mongoose.createConnection() per tenant dbName. Each master's
// data lives on a physically separate connection/database, so there is no
// shared query surface a filter could get wrong.
const pool = new Map();

function getTenantConnection(dbName) {
  if (!pool.has(dbName)) {
    const uri = `${mongoHost}/${dbName}`;
    const connection = mongoose.createConnection(uri);
    const ready = new Promise((resolve, reject) => {
      connection.once('open', () => {
        logger.info(`Tenant DB connected: ${dbName}`);
        resolve(connection);
      });
      connection.once('error', reject);
    });
    pool.set(dbName, ready);
  }
  return pool.get(dbName);
}

module.exports = { getTenantConnection };
