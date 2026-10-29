const express = require('express');

const createMasterRepository = require('../repositories/master.repository');
const createMasterService = require('../services/master.service');
const createMasterController = require('../controllers/master.controller');
const { validateLogin: validateMasterLogin } = require('../validators/master.validator');

const createMasterUserService = require('../services/master-user.service');
const createMasterUserController = require('../controllers/master-user.controller');
const {
  validateCreateMasterUser,
  validateMasterUserLogin,
} = require('../validators/master-user.validator');

const createAuthMiddleware = require('../middlewares/auth.middleware');

// Composition root for everything mounted at /master: the master's own
// login, master-created-user management (master-guarded), and the
// master-user's own login/profile (a separate, non-crossing login system).
const masterRepository = createMasterRepository();
const masterService = createMasterService(masterRepository);
const masterController = createMasterController(masterService);

const masterUserService = createMasterUserService(masterRepository);
const masterUserController = createMasterUserController(masterUserService);

const authMaster = createAuthMiddleware('master');
const authMasterUser = createAuthMiddleware('masterUser');

const router = express.Router();

router.post('/login', validateMasterLogin, masterController.login);

router.post('/user', authMaster, validateCreateMasterUser, masterUserController.create);
router.get('/users', authMaster, masterUserController.list);

router.post('/user/login', validateMasterUserLogin, masterUserController.login);
router.get('/user/profile', authMasterUser, masterUserController.profile);

module.exports = router;
