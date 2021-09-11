const express = require('express');
const Project = require('../models/Project');
const User = require('../models/User');
const auth = require('../middleware/auth');
const isActive = require('../middleware/isActive');

const router = new express.Router();

// Create Project
router.post('/projects', auth, isActive, async (req, res) => {
    try {
        let project = await Project.findOne({
            _id: req.body._id
        });

        if (project)
            return res.status(409).send();

        req.body.users = req.body.users ?? [];
        req.body.users = req.body.users.filter(userId => userId !== req.user._id);
        req.body.users = [
            ...req.body.users,
            req.user._id
        ];

        project = new Project({
            ...req.body,
            owner: req.user._id
        });

        await project.save();
        res.status(201).send(project);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get Projects
router.get('/projects', auth, isActive, async (req, res) => { 
    try {
        if (req.query.all === 'true') {
            // // if user wants see all projects
            let projects = await Project.find({}).populate({
                path: 'owner'
            });
            projects = projects.map(project => {
                project.owner = project.owner.toJSON();
                // new obj coz there is no way to add extra properties to mongo object
                const projectObj = {
                    project,
                    accessible: project.isAccessible(req.user._id)
                };
                return projectObj;
            });
            return res.send(projects);
        } else {
            const accessibleProjects = await Project.find({
                $or: [
                    {
                        owner: req.user._id
                    },
                    {
                        users: req.user._id
                    }
                ]
            });

            res.send(accessibleProjects);
        }
    } catch (e) {
        res.status(500).send(e);
    }
});

// Get Project by ID
router.get('/projects/:id', auth, isActive, async (req, res) => {
    const _id = req.params.id;

    try {
        const project = await Project.findOne({
            _id
        });

        if (!project)
            return res.status(404).send();

        if (!project.isAccessible(req.user._id)) 
            return res.status(401).send();

        res.send(project);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update Project
router.patch('/projects/:id', auth, isActive, async (req, res) => {
    const _id = req.params.id;

    try {
        const project = await Project.findOne({
            _id
        });
        if (!project)
            return res.status(404).send();

        // only owner can update the project
        if (project.owner !== req.user._id)
            return res.status(401).send();
        
        Object.keys(req.body).forEach(update => project[update] = req.body[update]);
        if (project.isModified('users'))
            return res.status(400).send(); // users should not be edited here
        await project.save();

        res.send(project);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Add / Remove user
router.post('/projects/:id', auth, isActive, async (req, res) => {
    const _id = req.params.id;
    const action = req.body.action;
    const userid = req.body.userid;
    
    try {
        const user = await User.findOne({
            _id: userid
        });

        if (!user) 
            return res.status(404).send();
        
        const project = await Project.findOne({
            _id
        });

        if (!project)
            return res.status(404).send();

        // only project owner can edit users list
        if (project.owner !== req.user._id)
            return res.status(401).send();

        await project.updateUsers(action, user._id);

        res.send(project);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;