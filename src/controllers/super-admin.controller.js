/**
 * @param {ReturnType<typeof import('../services/super-admin.service')>} superAdminService
 */
function createSuperAdminController(superAdminService) {
  async function login(req, res, next) {
    console.log('[super-admin.controller] login called, body:', req.body);
    try {
      const result = await superAdminService.login(req.body);
      console.log('[super-admin.controller] login succeeded, token issued');
      res.status(200).json(result);
    } catch (err) {
      console.log('[super-admin.controller] login failed:', err.message);
      next(err);
    }
  }

  return { login };
}

module.exports = createSuperAdminController;
