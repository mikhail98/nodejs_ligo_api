const express = require('express')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')

const socket = require('./socket/socket')

const usersRouter = require('./routes/users')
const authRouter = require('./routes/auth')
const tripsRouter = require('./routes/trips')
const googleRouter = require('./routes/google')
const parcelsRouter = require('./routes/parcels')
const defaultRouter = require('./routes/default')

const propertiesProvider = require('./utils/propertiesProvider')

const app = express()
const port = process.env.PORT || 80

const swaggerUi = require('swagger-ui-express')
const swaggerFile = require('./swagger/swagger.json')

const serverVersion = "1.11-develop"

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
app.use('/users', usersRouter)
app.use('/trips', tripsRouter)
app.use('/auth', authRouter)
app.use('/parcels', parcelsRouter)
app.use('/google', googleRouter)

app.use('/api-doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

const server = app.listen(port, () => {
    console.log(`Server has been started at port: ${port}`)
    console.log(`Server version: ${serverVersion}`)
})

socket.initSocket(server)