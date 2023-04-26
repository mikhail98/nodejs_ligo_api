const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Trip = require('../models/trip')
const Error = require('../errors/errors')
const auth = require('../middleware/auth')
const socket = require('../socket/socket')
const sendPushNotification = require('../firebase/push/fcm')

const router = express.Router()

//create user
router.post('/', async (req, res) => {
    try {
        const {name, email, password, isDriver, isActive, fcmToken, passportPhotoUrl, avatarUrl} = req.body

        const oldUser = await User.findOne({email})

        if (oldUser) {
            return res.status(404).send(Error.userExits)
        }

        const encryptedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({
            name: name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            isDriver: isDriver,
            isActive: isActive,
            isValidated: !isDriver,
            fcmToken: fcmToken,
            passportPhotoUrl: passportPhotoUrl,
            avatarUrl: avatarUrl,
            isAdmin: false
        })
        user.token = jwt.sign(
            {email_id: email.toLowerCase()}, "LigoTokenKey", {}
        )
        user.password = null
        res.status(200).send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})

//get all users
router.get('/', auth, async (req, res) => {
    try {
        const users = await User.find()
        users.forEach(user => user.password = null)
        res.status(200).send(users)
    } catch (error) {
        res.status(500).send(error)
    }
})

//get all drivers
router.get('/drivers', async (req, res) => {
    try {
        const drivers = await User.find({isDriver: true})
        drivers.forEach(driver => driver.password = null)
        res.status(200).send(drivers)
    } catch (error) {
        res.status(500).send(error)
    }
})

//get user by id
router.get('/:id', auth, async (req, res) => {
    const user = await User.findOne({_id: req.params.id})

    if (user === null) {
        res.status(404).send(Error.noSuchUser)
    } else {
        user.password = null
        res.status(200).send(user)
    }
})

//update user location
router.patch('/:id/location', auth, async (req, res) => {
    const _id = req.params.id
    const location = req.body["location"]
    const user = await User.findOneAndUpdate({_id}, {location: location})

    if (user === null) {
        res.status(404).send(Error.noSuchUser)
    } else {
        if(user.isDriver) {
            await Trip.findOneAndUpdate({driver: _id}, {driverLocation: location})
        }
        res.status(201).send()
    }
})

//update user status
router.patch('/:id/status', auth, async (req, res) => {
    const isActive = req.body["isActive"]
    const driver = req.params.id
    const user = await User.findOneAndUpdate({_id: req.params.id}, {isActive})

    if (!isActive) {
        await Trip.findOneAndRemove({driver})
    }

    if (user === null) {
        res.status(404).send(Error.noSuchUser)
    } else {
        res.status(201).send()
    }
})

//update user fcm token
router.patch('/:id/fcmToken', auth, async (req, res) => {
    const _id = req.params.id
    const user = await User.findOneAndUpdate({_id}, {fcmToken: req.body["fcmToken"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser)
    } else {
        res.status(201).send()
    }
})

//update user passportPhoto
router.patch('/:id/passportPhoto', auth, async (req, res) => {
    const _id = req.params.id
    const user = await User.findOneAndUpdate({_id}, {passportPhotoUrl: req.body["passportPhotoUrl"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser)
    } else {
        res.status(201).send()
    }
})

//update user фмфефк
router.patch('/:id/avatar', auth, async (req, res) => {
    const _id = req.params.id
    const user = await User.findOneAndUpdate({_id}, {avatarUrl: req.body["avatarUrl"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser)
    } else {
        res.status(201).send()
    }
})

//validate user
router.patch('/:id/validate', auth, async (req, res) => {
    const validatorEmail = req.user.email_id
    const validator = await User.findOne({email: validatorEmail})
    if (validator.isAdmin === false) {
        return res.status(403).send(Error.youNeedAdminRights)
    }
    const user = await User.findOne({_id: req.params.id})

    if (user === null) {
        res.status(404).send(Error.noSuchUser)
    } else {
        if (user.isDriver === false) {
            res.status(404).send(Error.notADriver)
        } else {
            let isValidated = req.body["isValidated"]
            await User.findOneAndUpdate({_id: req.params.id}, {isValidated})
            const responseUser = await User.findOne({_id: req.params.id})
            socket.emitEvent(responseUser._id.toString(), "userValidated", {isValidated})
            if (responseUser.fcmToken) {
                sendPushNotification(responseUser.fcmToken, {
                    key: "USER_VALIDATED",
                    isValidated: isValidated.toString()
                })
            }
            responseUser.password = null
            res.status(200).send(responseUser)
        }
    }
})

module.exports = router
