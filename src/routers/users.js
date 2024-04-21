const express = require('express');
const sharp = require('sharp');
const User = require('../models/User');
const auth = require('../middleware/auth');
const isActive = require('../middleware/isActive');
const userIdGenerator = require('../util/userid-generator');
const { avatarUpload } = require('../util/file-upload');
const { sendSignUpEmail } = require('../service/email.service');

const router = new express.Router();

// Login
router.post('/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password);
        const token = await user.generateAuthToken();
        res.send({user, token});
    } catch (e) {
        res.status(400).send();
    }
});

// Logout
router.post('/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => token.token !== req.token);
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

// Logout from all devices
router.post('/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();

        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

// Create User
router.post('/users', async (req, res) => {
    const user = new User({
        ...req.body,
        admin: false // no one is allowed to create admin user
    });

    try {
        user._id = userIdGenerator(await User.countDocuments({}));
        await user.save();
        const token = await user.generateAuthToken();
        sendSignUpEmail(user.name, user.email);
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get All users
router.get('/users', auth, isActive, async (req, res) => {
    let query = {};

    if (req.query.active === 'true' || req.query.active === 'false') {
        query.active = req.query.active === 'true';
    }

    if (req.query.search) {
        query = {
            ...query,
            $or: [
                {
                    name: {
                        $regex: req.query.search,
                        $options: 'i'
                    }
                },
                {
                    _id: {
                        $regex: req.query.search,
                        $options: 'i'
                    }
                }
            ]
        }
    }

    try {
        res.send(await User.find(query, null, {
            limit: +req.query.limit || 10 // only first 10 entries
        }).select('_id name'));
    } catch (e) {
        res.status(500).send();
    }
});

// Get Users by ID List
router.post('/usersByIdList', auth, async (req, res) => {
    if (!Array.isArray(req.body.ids))
        return res.status(400).send();
        
    if (!req.body.ids.length)
        return res.send([]);

    let query = {
        _id: {
            $in: req.body.ids
        }
    };

    if (req.query.active === 'true' || req.query.active === 'false') {
        query.active = req.query.active === 'true';
    }

    try {
        const users = await User.find(query).select('_id name');
        res.send(users);
    } catch (e) {
        res.status(500).send();
    }
});

// Get User
router.get('/users/:id', auth, isActive, async (req, res) => {
    const _id = req.params.id;

    try {
        const user = await User.findOne({
            _id
        });

        if (!user)
            return res.status(404).send();
        
        res.send(user);
    } catch (e) {
        res.status(500).send();
    }
});

// Get My Profile
router.get('/me', auth, async (req, res) => {
    res.send(req.user);
});

// Update My Profile
router.patch('/me', auth, async (req, res) => {
    try {
        Object.keys(req.body).forEach(update => {
            if (update === '_id')
                throw new Error();
            req.user[update] = req.body[update];
        });
        req.user.admin = false; // no update over admin is allowed
        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Activate My Profile
router.post('/activate', auth, async (req, res) => {
    try {
        req.user.active = true;
        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Deactivate My Profile
router.post('/deactivate', auth, isActive, async (req, res) => {
    try {
        req.user.active = false;
        await req.user.save();

        res.send(req.user);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get User Avatar
router.get('/users/:id/avatar', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user || !user.avatar) {
            throw new Error();
        }

        res.set('Content-Type', 'image/jpg');
        res.send(user.avatar);
    } catch (e) {
        res.status(404).send();
    }
});

// Upload My Avatar
router.post('/me/avatar', auth, avatarUpload.single('avatar'), async (req, res) => {
    const buffer = await sharp(req.file.buffer).resize({ width: 250, height: 250 }).png().toBuffer();
    req.user.avatar = buffer;
    await req.user.save();
    res.send();
}, (error, req, res, next) => {
    res.status(400).send({ message: error.message });
});

// Delete My Avatar
router.delete('/me/avatar', auth, async (req, res) => {
    try {
        req.user.avatar = undefined;
        await req.user.save();
        res.send();
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;