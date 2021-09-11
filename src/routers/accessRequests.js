const express = require('express');
const AccessRequest = require('../models/AccessRequest');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const isActive = require('../middleware/isActive');

const router = new express.Router();

// Create Access Request
router.post('/access-requests', auth, isActive, async (req, res) => {
    if (!req.body.accessRequestedFor)
        req.body.accessRequestedFor = req.user._id;
    const accessRequest = new AccessRequest({
        ...req.body,
        applicant: req.user._id,
        approved: false
    });

    try {
        const project = await Project.findOne({
            _id: accessRequest.project
        });

        if (!project)
            return res.status(404).send();

        const requestor = await User.findOne({
            _id: accessRequest.accessRequestedFor
        });

        if (!requestor)
            return res.status(404).send();

        await accessRequest.save();
        // send an email / a notification to an owner of the project and requestor
        res.status(201).send(accessRequest);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get Received Access Requests
router.get('/received-access-requests', auth, isActive, async (req, res) => { 
    try {
        let requests = await AccessRequest.find({}).populate({
            path: 'project',
            match: {
                owner: req.user._id
            }
        });
        requests = requests.filter(request => request.project);
        res.send(requests);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get My Access Requests
router.get('/my-access-requests', auth, isActive, async (req, res) => { 
    try {
        const requests = await AccessRequest.find({
            $or: [
                {
                    applicant: req.user._id
                },
                {
                    accessRequestedFor: req.user._id
                }
            ]
        });

        res.send(requests);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get an Access Request
router.get('/access-requests/:id', auth, isActive, async (req, res) => {
    const _id = req.params.id;

    try {
        const request = await AccessRequest.findOne({
            _id
        }).populate({
            path: 'project'
        });

        if (!request || !request.project)
            return res.status(404).send();

        // only applicant, access requestor or project owner can see access request
        if (request.applicant !== req.user._id && request.accessRequestedFor !== req.user._id && request.project.owner !== req.user._id)
            return res.status(401).send();

        res.send(request);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update Access Request
router.patch('/access-requests/:id', auth, isActive, async (req, res) => {
    const _id = req.params.id;

    try {
        let request = await AccessRequest.findOne({
            _id
        }).populate({
            path: 'project'
        });

        if (!request || !request.project)
            return res.status(404).send();

        // only applicant or project owner can edit access request
        if (request.applicant !== req.user._id && request.project.owner !== req.user._id)
            return res.status(401).send();
        
        // applicant can update desc and open / close status and project owner can update approval and open / close status.
        let allowedUpdates = [];
        if (req.user._id === request.applicant)
            allowedUpdates = ['description', 'open', 'accessRequestedFor'];
        else if (req.user._id === request.project.owner)
            allowedUpdates = ['approved', 'open'];

        const updates = Object.keys(req.body);
        if (updates.some(update => !allowedUpdates.includes(update)))
            return res.status(403).send();

        Object.keys(req.body).forEach(update => request[update] = req.body[update]);
        const isApprovalChanged = request.isModified('approved');
        const isRequestorChanged = request.isModified('accessRequestedFor');
        await request.save();

        if (isRequestorChanged) {
            const requestor = await User.findOne({
                _id: request.accessRequestedFor
            });

            if (!requestor)
                return res.status(404).send();
        }

        if (isApprovalChanged && request.approved)
            await request.project.updateUsers('add', request.accessRequestedFor);

        res.send(request);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Comment on Access Request
router.post('/access-requests/:id/comment', auth, isActive, async (req, res) => {
    const _id = req.params.id;

    try {
        const request = await AccessRequest.findOne({
            _id
        }).populate({
            path: 'project'
        });

        if (!request || !request.project)
            return res.status(404).send();

        // only applicant, access requestor or project owner can comment on an access request
        if (request.applicant !== req.user._id && request.accessRequestedFor !== req.user._id && request.project.owner !== req.user._id)
            return res.status(401).send();

        request.comments = [
            ...request.comments,
            {
                author: req.user._id,
                text: req.body.comment ?? ''
            }
        ];
        await request.save();
        res.send(request);
    } catch (e) {
        res.status(500).send();
    }
});

module.exports = router;