/**
 * @param {ReturnType<typeof import('../services/public-user.service')>} publicUserService
 */
function createPublicUserController(publicUserService) {
  async function signup(req, res, next) {
    try {
      const user = await publicUserService.signup(req.body);
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }

  async function login(req, res, next) {
    try {
      const result = await publicUserService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  async function profile(req, res, next) {
    try {
      const user = await publicUserService.getProfile(req.auth.id);
      res.status(200).json(user);
    } catch (err) {
      next(err);
    }
  }

  return { signup, login, profile };
}

module.exports = createPublicUserController;
