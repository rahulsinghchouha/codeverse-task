/**
 * @param {ReturnType<typeof import('../services/record.service')>} recordService
 */
function createRecordController(recordService) {
  async function create(req, res, next) {
    try {
      const { dbName, type, id } = req.auth;
      const record = await recordService.createRecord(dbName, { type, id }, req.body);
      res.status(201).json(record);
    } catch (err) {
      next(err);
    }
  }

  async function list(req, res, next) {
    try {
      const records = await recordService.listRecords(req.auth.dbName);
      res.status(200).json(records);
    } catch (err) {
      next(err);
    }
  }

  async function getById(req, res, next) {
    try {
      const record = await recordService.getRecord(req.auth.dbName, req.params.id);
      res.status(200).json(record);
    } catch (err) {
      next(err);
    }
  }

  async function update(req, res, next) {
    try {
      const record = await recordService.updateRecord(req.auth.dbName, req.params.id, req.body);
      res.status(200).json(record);
    } catch (err) {
      next(err);
    }
  }

  async function remove(req, res, next) {
    try {
      await recordService.deleteRecord(req.auth.dbName, req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  }

  return { create, list, getById, update, remove };
}

module.exports = createRecordController;
