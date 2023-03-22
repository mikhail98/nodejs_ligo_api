const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const usersRouter = require('./routes/users');
const authRouter = require('./routes/auth');
const tripsRouter = require('./routes/trips');

const app = express();
const port = 3000;

const isDebug = true

let mongoUrl = 'mongodb+srv://yrshvchstudio:nnAzaZwpALAOIyEB@pingocluster.jfl4hmk.mongodb.net/?retryWrites=true&w=majority'
if (isDebug) {
    mongoUrl = 'mongodb://localhost:27017/pingo'
}

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => {
        console.error('MongoDB Connection Error:', error);
    });

app.use(bodyParser.json());
app.use('/users', usersRouter);
app.use('/trips', tripsRouter);
app.use('/auth', authRouter);


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});