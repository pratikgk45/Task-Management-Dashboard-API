const express = require('express');
const Release = require("../models/Release");
const auth = require('../middleware/auth');
const isActive = require('../middleware/isActive');

const router = new express.Router();

// Create Release
router.post('/releases', auth, isActive, async (req, res) => {
    try {
        const release = new Release(req.body);

        if (!req.user.admin) 
            return res.status(401).send({
                message: 'Only Admin can release !'
            });
        
        await release.save();
        res.status(201).send(release);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update Release
router.patch('/releases/:version', auth, isActive, async (req, res) => {
    const version = req.params.version;

    try {
        if (!req.user.admin) 
            return res.status(401).send({
                message: 'Only Admin can release !'
            });

        const release = await Release.findOne({
            version
        });

        if (!release)
            return res.status(404).send();
        
        Object.keys(req.body).forEach(update => release[update] = req.body[update]);
        await release.save();

        res.send(release);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get Releases
router.get('/releases', async (req, res) => { 
    try {
        res.send(await Release.find({}));
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;