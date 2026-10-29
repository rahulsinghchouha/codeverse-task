const express = require('express');

const createPublicUserRepository = require('../repositories/public-user.repository');
const createPublicUserService = require('../services/public-user.service');
const createPublicUserController = require('../controllers/public-user.controller');
const { validateSignup, validateLogin } = require('../validators/public-user.validator');

const createAuthMiddleware = require('../middlewares/auth.middleware');

const publicUserRepository = createPublicUserRepository();
const publicUserService = createPublicUserService(publicUserRepository);
const publicUserController = createPublicUserController(publicUserService);

const authPublicUser = createAuthMiddleware('publicUser');

const router = express.Router();

router.post('/signup', validateSignup, publicUserController.signup);
router.post('/login', validateLogin, publicUserController.login);
router.get('/profile', authPublicUser, publicUserController.profile);

module.exports = router;
