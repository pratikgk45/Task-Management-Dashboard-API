const mongoose = require('mongoose');

const schema = {
    _id: {
        type: String
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String
    },
    owner: {
        type: String,
        required: true,
        ref: 'User'
    },
    users: [{
        type: String,
        ref: 'User'
    }]
};

const projectSchema = new mongoose.Schema(schema, {
    timestamps: true
});

projectSchema.virtual('tasks', {
    ref: 'Task',
    localField: '_id',
    foreignField: 'project'
});

projectSchema.methods.isAccessible = function (id) {
    const project = this;

    if (project.owner !== id && !project.users.includes(id)) 
        return false;
    
    return true;
}

projectSchema.methods.updateUsers = async function (action, id) {
    const project = this;

    switch(action) {
        case 'add':
            project.users = project.users.filter(userid => userid !== id);
            project.users = [
                ...project.users,
                id
            ];
            break;
        case 'remove':
            project.users = project.users.filter(userid => userid !== id);
            break;
        case 'clear':
            project.users = [];
            break;
    }

    await project.save();
}

projectSchema.methods.toJSON = function () {
    const project = this;
    const projectObj = project.toObject();

    delete projectObj.users;

    return projectObj;
}

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;