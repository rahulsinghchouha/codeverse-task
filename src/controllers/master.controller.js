/**
 * @param {ReturnType<typeof import('../services/master.service')>} masterService
 */
function createMasterController(masterService) {
  async function create(req, res, next) {
    console.log('[master.controller] create called, body:', req.body, 'by superadmin:', req.auth.id);
    try {
      const master = await masterService.createMaster(req.body, req.auth.id);
      console.log('[master.controller] create succeeded:', master.slug, master.dbName);
      res.status(201).json(master);
    } catch (err) {
      console.log('[master.controller] create failed:', err.message);
      next(err);
    }
  }

  async function list(_req, res, next) {
    console.log('[master.controller] list called');
    try {
      const masters = await masterService.listMasters();
      console.log('[master.controller] list returning', masters.length, 'master(s)');
      res.status(200).json(masters);
    } catch (err) {
      console.log('[master.controller] list failed:', err.message);
      next(err);
    }
  }

  async function login(req, res, next) {
    try {
      const result = await masterService.login(req.body);
      res.status(200).json(result);
    } catch (err) {
      next(err);
    }
  }

  return { create, list, login };
}

module.exports = createMasterController;
