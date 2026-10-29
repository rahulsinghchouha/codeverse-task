const { isNonEmptyString, validateFields } = require('./common.validator');

function validateCreateRecord(req, res, next) {
  return validateFields(req, res, next, [['title', isNonEmptyString, 'title is required']]);
}

module.exports = { validateCreateRecord };
