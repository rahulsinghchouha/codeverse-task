/**
 * Translates HTTP <-> service calls only. No business rules or persistence
 * details live here. (SRP)
 * @param {ReturnType<typeof import('../services/user.service')>} userService
 */
function createUserController(userService) {
  async function create(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async function getById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async function list(_req, res, next) {
    try {
      const users = await userService.listUsers();
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  async function remove(req, res, next) {
    try {
      await userService.deleteUser(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  return { create, getById, list, update, remove };
}

module.exports = createUserController;
