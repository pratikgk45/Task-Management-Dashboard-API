const express = require('express');
const sharp = require('sharp');
const User = require('../models/User');
const auth = require('../middleware/auth');
const isActive = require('../middleware/isActive');
const userIdGenerator = require('../util/userid-generator');
const { avatarUpload } = require('../util/file-upload');

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
        res.status(201).send({user, token});
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get All users
router.get('/users', auth, isActive, async (req, res) => {
    let query = {};

    if (req.query.active === 'true' || req.query.active === 'false') {
        query.active = req.query.active;
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
        res.send(await User.find(query));
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
        Object.keys(req.body).forEach(update => req.user[update] = req.body[update]);
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
router.get('/users/:id/avatar', async (req, res) => {
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