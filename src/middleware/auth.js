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
            return res.status(404).send();
        }

        req.user = user;
        req.token = token;
        next();
    } catch (e) {
        if (e instanceof jwt.TokenExpiredError) {
            return res.status(401).send({ message : 'Session Expired, Please Login Again !'});
        }
        res.status(401).send({ message : 'Authenticate first.'});
    }
};

module.exports = auth;