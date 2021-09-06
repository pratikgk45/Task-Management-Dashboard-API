const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const decoded = jwt.verify(token, process.env.TOKEN_PRIVATE_KEY);
        const user = await User.findOne({
            _id: decoded._id,
            'tokens.token': token
        });

        if (!user) {
            throw new Error('Authentication Failed');
        }

        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        res.status(401).send({ error : 'Authenticate first.'});
    }
};

module.exports = auth;