const express = require('express');
const createUserRepository = require('../repositories/user.repository');
const createUserService = require('../services/user.service');
const createUserController = require('../controllers/user.controller');
const { validateCreateUser } = require('../validators/user.validator');

// Composition root for this feature: wire the concrete repository into the
// service here, so the service itself never knows which implementation it got.
const userRepository = createUserRepository();
const userService = createUserService(userRepository);
const userController = createUserController(userService);

const router = express.Router();

router.post('/', validateCreateUser, userController.create);
router.get('/', userController.list);
router.get('/:id', userController.getById);
router.patch('/:id', userController.update);
router.delete('/:id', userController.remove);

module.exports = router;
