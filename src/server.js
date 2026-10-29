const app = require('./app');
const { port } = require('./config/env');
const { connectDatabase } = require('./config/database');
const { connectRedis } = require('./config/redis');
const seedSuperAdmin = require('./bootstrap/seed-superadmin');
const logger = require('./utils/logger');

async function start() {
  await connectDatabase();
  await connectRedis();
  await seedSuperAdmin();
  app.listen(port, () => {
    logger.info(`Server listening on port ${port}`);
  });
}

start().catch((err) => {
  logger.error('Failed to start server', err);
  process.exit(1);
});
