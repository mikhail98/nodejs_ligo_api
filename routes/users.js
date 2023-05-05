const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Trip = require('../models/trip')
const Error = require('../errors/errors')
const auth = require('../middleware/auth')
const socket = require('../socket/socket')
const sendPushNotification = require('../firebase/push/fcm')
const {Parcel} = require("../models/parcel");

const router = express.Router()

//create user
router.post('/', async (req, res) => {
    try {
        const {name, email, password, phone, isDriver, fcmToken, passportPhotoUrl, avatarUrl} = req.body

        const oldUser = await User.findOne({email})

        if (oldUser) {
            return res.status(400).send(Error.userExits)
        }

        const encryptedPassword = await bcrypt.hash(password, 10)
        const user = await User.create({
            name: name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            phone: phone,
            isDriver: isDriver,
            isValidated: !isDriver,
            fcmTokens: [fcmToken],
            passportPhotoUrl: passportPhotoUrl,
            avatarUrl: avatarUrl,
            isAdmin: false
        })
        user.token = jwt.sign(
            {email_id: email.toLowerCase()}, "LigoTokenKey", {}
        )
        user.password = null
        user.fcmTokens = []
        res.status(200).send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})

//get all users
router.get('/', auth, async (req, res) => {
    const users = await User.find()
    users.forEach(user => {
        user.password = null
        user.fcmTokens = []
    })
    res.status(200).send(users)
})

//get all drivers
router.get('/drivers', async (req, res) => {
    try {
        const drivers = await User.find({isDriver: true})
        drivers.forEach(driver => {
            driver.password = null
            driver.fcmTokens = []
        })
        res.status(200).send(drivers)
    } catch (error) {
        res.status(500).send(error)
    }
})

//get user by id
router.get('/:id', auth, async (req, res) => {
    const user = await User.findOne({_id: req.params.id})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    user.password = null
    user.fcmTokens = []
    res.status(200).send(user)
})

//update user location
router.patch('/:id/location', auth, async (req, res) => {
    const _id = req.params.id
    const {location} = req.body
    const user = await User.findOneAndUpdate({_id}, {location: location})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    if (user.isDriver) {
        await Trip.findOneAndUpdate({driver: _id}, {driverLocation: location})
    }
    res.status(200).send()
})

//update user fcm token
router.patch('/:id/fcmToken', auth, async (req, res) => {
    const _id = req.params.id
    const user = await User.findOne({_id})
    const {fcmToken} = req.body
    user.fcmTokens.push(fcmToken)
    await User.updateOne({_id}, user)

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    res.status(200).send()
})

//update user passportPhoto
router.patch('/:id/passportPhoto', auth, async (req, res) => {
    const _id = req.params.id
    const {passportPhotoUrl} = req.body
    const user = await User.findOneAndUpdate({_id}, {passportPhotoUrl})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    res.status(200).send()
})

//update user avatar
router.patch('/:id/avatar', auth, async (req, res) => {
    const _id = req.params.id
    const {avatarUrl} = req.body
    const user = await User.findOneAndUpdate({_id}, {avatarUrl})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    res.status(200).send()
})

//feedback user
router.patch('/:id/rating', auth, async (req, res) => {
    const userFromEmail = req.user.email_id
    const userTo = await User.findOne({_id: req.params.id})

    if (!userTo) {
        return res.status(400).send(Error.noSuchUser)
    }

    const {rating} = req.body
    if (rating.userFrom !== userFromEmail) {
        return res.status(400).send(Error.noSuchUser)
    }

    userTo.ratings.push(rating)
    await User.updateOne({_id: req.params.id}, userTo)
    res.status(200).send()
})


//validate user
router.patch('/:id/validate', auth, async (req, res) => {
    const validatorEmail = req.user.email_id
    const validator = await User.findOne({email: validatorEmail})
    if (!validator.isAdmin) {
        return res.status(403).send(Error.youNeedAdminRights)
    }
    const user = await User.findOne({_id: req.params.id})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    if (!user.isDriver) {
        return res.status(400).send(Error.notADriver)
    }

    let {isValidated} = req.body
    await User.findOneAndUpdate({_id: req.params.id}, {isValidated})
    const responseUser = await User.findOne({_id: req.params.id})
    socket.emitEvent(responseUser._id.toString(), "userValidated", {isValidated})
    responseUser.fcmTokens.forEach(token => {
        sendPushNotification(token, {
            key: "USER_VALIDATED",
            isValidated: isValidated.toString()
        })
    })
    responseUser.password = null
    responseUser.fcmTokens = []
    res.status(200).send(responseUser)
})

router.get('/:id/senderParcels', auth, async (req, res) => {
    const parcels = await Parcel.find({userId: req.params.id})
    const responseParcels = await Promise.all(
        parcels.map(async (parcelId) => {
            return await getParcelWithUserById(parcelId)
        })
    )
    res.status(200).send(await getResponseTrips(responseParcels))
})

router.get('/:id/driverTrips', auth, async (req, res) => {
    const trips = await Trip.find({driverId: req.params.id})
    res.status(200).send(await getResponseTrips(trips))
})

router.get('/:id/senderTrips', auth, async (req, res) => {
    const parcels = await Parcel.find({userId: req.params.id})

    const trips = await Trip.find()
    const responseTrips = await Promise.all(
        parcels.map(async (parcel) => {
            if (parcel.status === "CREATED") {
                return {
                    parcels: [parcel],
                    createdAt: parcel.createdAt
                }
            } else {
                const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcel._id.toString()))
                const responseTrip = await getTripWithDriver(trip.toObject())
                responseTrip.parcels = await Promise.all(
                    responseTrip.parcels.map(async (parcelId) => {
                        return await getParcelWithUserById(parcelId)
                    })
                )
                return responseTrip
            }
        })
    )
    res.status(200).send(responseTrips)
})

async function getResponseTrips(trips) {
    return await Promise.all(
        trips.map(async (trip) => {
            const responseTrip = await getTripWithDriver(trip.toObject())
            responseTrip.parcels = await Promise.all(
                responseTrip.parcels.map(async (parcelId) => {
                    return await getParcelWithUserById(parcelId)
                })
            )
            return responseTrip
        })
    )
}

async function getTripWithDriver(trip) {
    const user = await User.findOne({_id: trip.driverId})
    user.password = null
    user.fcmTokens = []
    trip.driver = user
    return trip
}

async function getParcelWithUserById(parcelId) {
    const parcel = await Parcel.findOne({_id: parcelId})
    const user = await User.findOne({_id: parcel.userId})
    const responseParcel = parcel.toObject()
    user.password = null
    user.fcmTokens = []
    responseParcel.user = user
    return responseParcel
}

module.exports = router
