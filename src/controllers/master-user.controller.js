/**
 * @param {ReturnType<typeof import('../services/master-user.service')>} masterUserService
 */
function createMasterUserController(masterUserService) {
  async function create(req, res, next) {
    try {
      const user = await masterUserService.createUser(req.auth.dbName, req.auth.masterId, req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async function list(req, res, next) {
    try {
      const users = await masterUserService.listUsers(req.auth.dbName);
      res.status(200).json(users);
    } catch (err) {
      next(err);
    }
  }

  async function login(req, res, next) {
    try {
      const result = await masterUserService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async function profile(req, res, next) {
    try {
      const user = await masterUserService.getProfile(req.auth.dbName, req.auth.id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  return { create, list, login, profile };
}

module.exports = createMasterUserController;
