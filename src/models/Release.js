const mongoose = require('mongoose');

const schema = {
    version: {
        type: String,
        required: true,
        unique: true
    },
    description: {
        type: String,
    },
};

const releaseSchema = new mongoose.Schema(schema, {
    timestamps: true
});

const Release = mongoose.model('Release', releaseSchema);

module.exports = Release;