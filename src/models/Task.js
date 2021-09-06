const mongoose = require('mongoose');

const schema = {
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    project: {
        type: String,
        required: true,
        ref: 'Project'
    },
    status: {
        type: String,
        default: 'Open'
    },
    resolution: {
        type: String
    },
    reporter: {
        type: String,
        required: true,
        ref: 'User'
    },
    assignee: {
        type: String,
        ref: 'User'
    },
    attachment: {
        type: Buffer
    },
    last_updater: {
        type: String,
        required: true,
        ref: 'User'
    }
};

const taskSchema = new mongoose.Schema(schema, {
    timestamps: true
});

const Task = mongoose.model('Task', taskSchema);

module.exports = Task;