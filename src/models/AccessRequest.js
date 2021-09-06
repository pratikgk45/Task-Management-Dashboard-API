const mongoose = require('mongoose');

const schema = {
    description: {
        type: String
    },
    comments: [{
        author: {
            type: String,
            required: true,
            ref: 'User'
        },
        text: {
            type: String
        }
    }],
    applicant: {
        type: String,
        required: true,
        ref: 'User'
    },
    accessRequestedFor: {
        type: String,
        required: true,
        ref: 'User'
    },
    project: {
        type: String,
        required: true,
        ref: 'Project'
    },
    approved: {
        type: Boolean,
        default: false
    },
    open: {
        type: Boolean,
        default: true
    }
};

const accessRequestSchema = new mongoose.Schema(schema, {
    timestamps: true
});

const AccessRequest = mongoose.model('AccessRequest', accessRequestSchema);

module.exports = AccessRequest;