const User = require('../models/User');

const isActive = async (req, res, next) => {
    try {
        if (!req.user.active) {
            throw new Error('Deactivated Account');
        }
        next();
    } catch (e) {
        res.status(401).send({
            error : 'You need to activate your account first.'
        });
    }
};

module.exports = isActive;