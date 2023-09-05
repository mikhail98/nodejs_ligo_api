const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const socket = require('./utils/socket')

const authRouter = require('./route/auth')
const usersRouter = require('./route/users')
const tripsRouter = require('./route/trips')
const chatsRouter = require('./route/chats')
const googleRouter = require('./route/google')
const parcelsRouter = require('./route/parcels')
const defaultRouter = require('./route/default')

const MatchingService = require('./service/MatchingService')

const propertiesProvider = require('./utils/propertiesProvider')

const app = express()
const port = process.env.PORT || 80

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger/swagger.json')

const serverVersion = "2.2"

mongoose.connect(propertiesProvider.getMongoUrl(), {
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
app.use('/auth', authRouter)
app.use('/chats', chatsRouter)
app.use('/users', usersRouter)
app.use('/trips', tripsRouter)
app.use('/google', googleRouter)
app.use('/parcels', parcelsRouter)
app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

const server = app.listen(port, () => {
    console.log(`Server has been started at port: ${port}`)
    console.log(`Server version: ${serverVersion}`)
})

MatchingService.startMatchingJob()

socket.initSocket(server)