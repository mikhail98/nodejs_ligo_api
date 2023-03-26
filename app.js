const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const tripsRouter = require('./routes/trips');
const defaultRouter = require('./routes/default');

const app = express();
const port = process.env.PORT || 80;

const socket = require('./socket/socket')

const mongoUrl = 'mongodb+srv://yrshvchstudio:nnAzaZwpALAOIyEB@pingocluster.jfl4hmk.mongodb.net/pingo?retryWrites=true&w=majority'

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => {
        console.error('MongoDB Connection Error:', error);
    });

app.use(bodyParser.json());
app.use('/', defaultRouter);
app.use('/users', usersRouter);
app.use('/trips', tripsRouter);
app.use('/auth', authRouter);

socket.init((userId) => {
    console.log('User entered: ' + userId);
})

app.listen(port, () => {
    console.log(`Server has been started at port:${port}`);
});