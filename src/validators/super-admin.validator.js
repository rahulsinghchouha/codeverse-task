const { isEmail, isNonEmptyString, validateFields } = require('./common.validator');

function validateLogin(req, res, next) {
  return validateFields(req, res, next, [
    ['email', isEmail, 'a valid email is required'],
    ['password', isNonEmptyString, 'password is required'],
  ]);
}

module.exports = { validateLogin };
