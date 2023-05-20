const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Trip = require('../models/trip')
const Rating = require('../models/rating').Rating
const Error = require('../errors/errors')
const auth = require('../middleware/auth')
const log = require('../middleware/log')
const socket = require('../socket/socket')
const sendPushNotifications = require("../firebase/fcm")
const {Parcel} = require("../models/parcel")
const Extensions = require('../utils/extensions')

const router = express.Router()

//create user
router.post('/', log, async (req, res) => {
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
router.get('/', log, auth, async (req, res) => {
    const users = await User.find()
    users.forEach(user => {
        user.password = null
        user.fcmTokens = []
    })
    res.status(200).send(users)
})

//get all drivers
router.get('/drivers', log, async (req, res) => {
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
router.get('/:id', log, auth, async (req, res) => {
    const user = await User.findOne({_id: req.params.id})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    user.password = null
    user.fcmTokens = []
    res.status(200).send(user)
})

//update user location
router.patch('/:id/location', log, auth, async (req, res) => {
    const _id = req.params.id
    const {location} = req.body
    const user = await User.findOneAndUpdate({_id}, {location: location})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    if (user.isDriver) {
        const trip = await Trip.findOne({driverId: _id, status: 'ACTIVE'})
        if (trip) {
            const responseTrip = await Extensions.getResponseTripById(trip._id)
            responseTrip.parcels
                .filter(parcel => parcel.status === 'ACCEPTED' || parcel.status === 'PICKED')
                .map(parcel => parcel.userId)
                .forEach(userId => socket.emitEvent(userId, "driverLocationUpdated", location))

            const parcels = await Parcel.find({status: 'CREATED'})
            const parcelIds = parcels.map(parcel => parcel._id.toString())

            Promise.allSettled(parcelIds.map(parcelId => Extensions.requestDriverForParcel(parcelId)))
                .then(() => {
                })
                .catch(() => {
                })
        }
    }
    res.status(200).send()
})

//update user fcm token
router.patch('/:id/fcmToken', log, auth, async (req, res) => {
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
router.patch('/:id/passportPhoto', log, auth, async (req, res) => {
    const _id = req.params.id
    const {passportPhotoUrl} = req.body
    const user = await User.findOneAndUpdate({_id}, {passportPhotoUrl})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    res.status(200).send()
})

//update user avatar
router.patch('/:id/avatar', log, auth, async (req, res) => {
    const _id = req.params.id
    const {avatarUrl} = req.body
    const user = await User.findOneAndUpdate({_id}, {avatarUrl})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    res.status(200).send()
})

//feedback user
router.patch('/:id/rating', log, auth, async (req, res) => {
    const validatorEmail = req.user.email_id
    const validator = await User.findOne({email: validatorEmail})
    const userFromId = validator._id

    const userTo = await User.findOne({_id: req.params.id})

    if (!userTo) {
        return res.status(400).send(Error.noSuchUser)
    }
    const userToId = userTo._id

    const {rating} = req.body

    const ratingExists = userTo.ratings.filter(rating => {
        return rating.userFrom === userFromId.toString() && rating.userTo === userToId.toString()
    }).length !== 0

    if (ratingExists) {
        return res.status(400).send(Error.ratingExists)
    }

    userTo.ratings.push(Rating({userFrom: userFromId, userTo: userToId, rating}))
    await User.updateOne({_id: req.params.id}, userTo)

    res.status(200).send()
})


//validate user
router.patch('/:id/validate', log, auth, async (req, res) => {
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
    await sendPushNotifications(responseUser._id, {
        key: "USER_VALIDATED",
        isValidated: isValidated.toString()
    })
    responseUser.password = null
    responseUser.fcmTokens = []
    res.status(200).send(responseUser)
})

router.get('/:id/driverTrips', log, auth, async (req, res) => {
    const trips = await Trip.find({driverId: req.params.id})
    res.status(200).send(await Extensions.getResponseTripsById(trips.map(trip => trip._id)))
})

router.get('/:id/senderTrips', log, auth, async (req, res) => {
    const parcels = await Parcel.find({userId: req.params.id})

    const trips = await Trip.find()
    const responseTrips = await Promise.all(
        parcels.map(async (parcel) => {
            if (parcel.status === "CREATED" || parcel.status === "CANCELLED") {
                const parcelWithUser = await Extensions.getResponseParcelById(parcel._id)
                return {
                    parcels: [parcelWithUser],
                    createdAt: parcel.createdAt
                }
            } else {
                const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcel._id.toString()))
                const responseTrip = await Extensions.getResponseTripById(trip._id)
                responseTrip.parcels = responseTrip.parcels
                    .filter(tripParcel => tripParcel._id.toString() === parcel._id.toString())
                return responseTrip
            }
        })
    )
    res.status(200).send(responseTrips)
})

module.exports = router
