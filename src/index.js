const express = require('express');
const cors = require('cors');
require('./db/mongoose');
const userRouter = require('./routers/users');
const taskRouter = require('./routers/tasks');
const projectRouter = require('./routers/projects');
const accessRequestRouter = require('./routers/accessRequests');

const app = express();
const port = process.env.PORT;

app.use(cors({
    origin: ['http://localhost:8000', 'https://org-task-manager-app.herokuapp.com']
}));

app.use(express.json());
app.use(userRouter);
app.use(projectRouter);
app.use(accessRequestRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log(`Server is up at port ${port}`);
});