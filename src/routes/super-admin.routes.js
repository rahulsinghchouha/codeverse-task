const express = require('express');

const createSuperAdminRepository = require('../repositories/super-admin.repository');
const createSuperAdminService = require('../services/super-admin.service');
const createSuperAdminController = require('../controllers/super-admin.controller');
const { validateLogin: validateSuperAdminLogin } = require('../validators/super-admin.validator');

const createMasterRepository = require('../repositories/master.repository');
const createMasterService = require('../services/master.service');
const createMasterController = require('../controllers/master.controller');
const { validateCreateMaster } = require('../validators/master.validator');

const createAuthMiddleware = require('../middlewares/auth.middleware');

// Composition root for everything mounted at /superadmin: the superadmin's
// own login, plus the master-registry actions that only a superadmin may
// perform (POST /superadmin/master, GET /superadmin/masters).
const superAdminRepository = createSuperAdminRepository();
const superAdminService = createSuperAdminService(superAdminRepository);
const superAdminController = createSuperAdminController(superAdminService);

const masterRepository = createMasterRepository();
const masterService = createMasterService(masterRepository);
const masterController = createMasterController(masterService);

const authSuperAdmin = createAuthMiddleware('superadmin');

const router = express.Router();

router.post('/login', validateSuperAdminLogin, superAdminController.login);
router.post('/master', authSuperAdmin, validateCreateMaster, masterController.create);
router.get('/masters', authSuperAdmin, masterController.list);

module.exports = router;
