const express = require('express');

const createRecordService = require('../services/record.service');
const createRecordController = require('../controllers/record.controller');
const { validateCreateRecord } = require('../validators/record.validator');

const createAuthMiddleware = require('../middlewares/auth.middleware');

const recordService = createRecordService();
const recordController = createRecordController(recordService);

// Either a master or a master-user may operate on their own tenant's data —
// which tenant is decided entirely by req.auth.dbName from the token.
const authTenantActor = createAuthMiddleware(['master', 'masterUser']);

const router = express.Router();

router.use(authTenantActor);
router.post('/', validateCreateRecord, recordController.create);
router.get('/', recordController.list);
router.get('/:id', recordController.getById);
router.put('/:id', recordController.update);
router.delete('/:id', recordController.remove);

module.exports = router;
