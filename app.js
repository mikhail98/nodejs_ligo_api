const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const usersRouter = require('./routes/users')
const authRouter = require('./routes/auth')
const tripsRouter = require('./routes/trips')
const googleRouter = require('./routes/google')
const parcelsRouter = require('./routes/parcels')
const defaultRouter = require('./routes/default')
const properties = require('./local/properties')

const app = express()
const port = process.env.PORT || 80

const socket = require('./socket/socket')

const serverVersion = "1.4-develop"

const mongoUrl = process.env.MONGODB_URL || properties.MONGODB_URL

mongoose.connect(mongoUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('MongoDB Connected'))
    .catch((error) => {
        console.error('MongoDB Connection Error:', error)
    })

app.use(bodyParser.json())
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", '*')
    res.header('Access-Control-Allow-Methods', '*')
    res.header("Access-Control-Allow-Headers", '*')

    next()
})
app.use('/', defaultRouter)
app.use('/users', usersRouter)
app.use('/trips', tripsRouter)
app.use('/auth', authRouter)
app.use('/parcels', parcelsRouter)
app.use('/google', googleRouter)

const server = app.listen(port, () => {
    console.log(`Server has been started at port: ${port}`)
    console.log(`Server version: ${serverVersion}`)
})

socket.initSocket(server)