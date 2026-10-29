const createSuperAdminRepository = require('../repositories/super-admin.repository');
const createSuperAdminService = require('../services/super-admin.service');
const { superadminEmail, superadminPassword } = require('../config/env');
const logger = require('../utils/logger');

// There is no public create-superadmin endpoint by design (brief only lists
// POST /superadmin/login) — the one superadmin account is seeded from env
// vars the first time the server boots against an empty SuperAdmin collection.
async function seedSuperAdmin() {
  const repository = createSuperAdminRepository();
  const service = createSuperAdminService(repository);
  await service.ensureSeeded(superadminEmail, superadminPassword);
  logger.info('Superadmin seed check complete');
}

module.exports = seedSuperAdmin;
