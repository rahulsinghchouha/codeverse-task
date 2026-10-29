const { isEmail, isNonEmptyString, minLength, validateFields } = require('./common.validator');

function validateCreateMasterUser(req, res, next) {
  return validateFields(req, res, next, [
    ['name', isNonEmptyString, 'name is required'],
    ['email', isEmail, 'a valid email is required'],
    ['password', minLength(6), 'password must be at least 6 characters'],
  ]);
}

function validateMasterUserLogin(req, res, next) {
  return validateFields(req, res, next, [
    ['masterSlug', isNonEmptyString, 'masterSlug is required'],
    ['email', isEmail, 'a valid email is required'],
    ['password', isNonEmptyString, 'password is required'],
  ]);
}

module.exports = { validateCreateMasterUser, validateMasterUserLogin };
