const express = require('express');
const Task = require('../models/Task');
const Project = require('../models/Project');
const auth = require('../middleware/auth');
const isActive = require('../middleware/isActive');

const router = new express.Router();

// Create Task
router.post('/projects/:id/tasks', auth, isActive, async (req, res) => {
    const task = new Task({
        ...req.body,
        project: req.params.id,
        reporter: req.user._id,
        last_updater: req.user._id
    });

    try {
        await task.populate({
            path: 'project'
        }).execPopulate();

        if (!task.project)
            return res.status(404).send();

        // to create any task, respective project should be accessible to the user
        if (!task.project.isAccessible(req.user._id))
            return res.status(403).send();

        // assignee should have an access to this project
        if (task.assignee && !task.project.isAccessible(task.assignee))
            return res.status(403).send();
        
        await task.save();
        res.status(201).send(task);
    } catch (e) {
        res.status(400).send(e);
    }
});

// Get Tasks for a particular project
router.get('/projects/:id/tasks', auth, isActive, async (req, res) => {
    const _id = req.params.id;

    try {
        const project = await Project.findOne({
            _id
        }).populate({
            path: 'tasks'
        });

        if (!project)
            return res.status(404).send();
        
        if (!project.isAccessible(req.user._id))
            return res.status(401).send();

        res.send(project.tasks);
    } catch (e) {
        res.status(500).send();
    }
});

// Get Task By ID
router.get('/projects/:id/tasks/:taskid', auth, isActive, async (req, res) => {
    const _id = req.params.taskid;
    const projectId = req.params.id;

    try {
        const task = await Task.findOne({
            _id,
            project: projectId
        }).populate({
            path: 'project'
        });

        if (!task)
            return res.status(404).send();

        if (!task.project.isAccessible(req.user._id))
            return res.status(401).send();

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

// Update Task
router.patch('/projects/:id/tasks/:taskid', auth, isActive, async (req, res) => {
    const _id = req.params.taskid;
    const projectId = req.params.id;

    try {
        const task = await Task.findOne({
            _id,
            project: projectId
        }).populate({
            path: 'project'
        });

        if (!task)
            return res.status(404).send();

        if (!task.project.isAccessible(req.user._id))
            return res.status(401).send();

        const restrictedUpdates = ['project'];
        const updates = Object.keys(req.body);
        if (updates.some(update => restrictedUpdates.includes(update)))
            return res.status(403).send();

        Object.keys(req.body).forEach(update => task[update] = req.body[update]);
        task.last_updater = req.user._id;
        await task.save();

        res.send(task);
    } catch (e) {
        res.status(500).send(e);
    }
});

module.exports = router;