const password_validator = require('password-validator');

const passwordValidator = new password_validator();

passwordValidator
    .is().min(8)
    .is().max(100)
    .has().uppercase()
    .has().lowercase()
    .has().digits(2)
    .has().not().spaces();

module.exports = passwordValidator;