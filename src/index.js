const express = require('express');
const cors = require('cors');
require('./db/mongoose');
const userRouter = require('./routers/users');
const taskRouter = require('./routers/tasks');
const projectRouter = require('./routers/projects');
const accessRequestRouter = require('./routers/accessRequests');
const releaseRouter = require('./routers/releases');

const app = express();
const port = process.env.PORT;

app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000', process.env.TASK_MANAGER_PROD_APP]
}));

app.use(express.json());
app.use(userRouter);
app.use(projectRouter);
app.use(accessRequestRouter);
app.use(taskRouter);
app.use(releaseRouter);

app.listen(port, () => {
    console.log(`Server is up at port ${port}`);
});