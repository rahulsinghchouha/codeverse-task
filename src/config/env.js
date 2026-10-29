require('dotenv').config();

module.exports = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://localhost:27017/codevere',
  mongoHost: process.env.MONGO_HOST || 'mongodb://localhost:27017',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  superadminEmail: process.env.SUPERADMIN_EMAIL || 'admin@codevere.com',
  superadminPassword: process.env.SUPERADMIN_PASSWORD || 'ChangeMe123!',
};
