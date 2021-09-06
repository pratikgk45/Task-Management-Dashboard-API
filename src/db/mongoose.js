const mongoose = require('mongoose');

const dbURL = 'mongodb://127.0.0.1:27017/task-manager';

mongoose.connect(dbURL, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useUnifiedTopology: true
});