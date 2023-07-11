const express = require('express')
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const Trip = require('../models/trip')
const Parcel = require("../models/parcel")
const Rating = require('../models/rating').Rating
const Error = require('../errors/errors')
const auth = require('../middleware/auth')
const log = require('../middleware/log')
const socket = require('../socket/socket')
const Extensions = require('../utils/extensions')
const sendPushNotifications = require("../firebase/fcm")
const propertiesProvider = require("../utils/propertiesProvider")
const verifyGoogleToken = require("../utils/googleTokenVerifier")

const axios = require("axios")

const router = express.Router()

//create user
router.post('/', log, async (req, res) => {
    // #swagger.tags = ['Users']
    try {
        const {name, email, token, phone, role, fcmToken, passportPhotoUrl, avatarUrl} = req.body

        const oldUser = await User.findOne({email})

        if (oldUser) {
            return res.status(400).send(Error.userExits)
        }

        const isValidToken = await verifyGoogleToken(email, token)
        if (!isValidToken) {
            return res.status(400).send(Error.cannotCreateUser)
        }

        let fcmTokens
        if (fcmToken) {
            fcmTokens = [fcmToken]
        } else {
            fcmTokens = []
        }

        const user = await User.create({
            name: name,
            email: email.toLowerCase(),
            phone: phone,
            role: role,
            isValidated: true,
            fcmTokens: fcmTokens,
            passportPhotoUrl: passportPhotoUrl,
            avatarUrl: avatarUrl,
            isAdmin: false,
            isDeleted: false
        })
        user.token = jwt.sign(
            {email_id: email.toLowerCase()}, "LigoTokenKey", {}
        )
        user.password = null
        user.fcmTokens = []

        if (process.env.PROD) {
            const text = `New user!!! 🙋🙋🙋%0A%0AName: ${user.name}%0AEmail: ${user.email}%0APhone: ${user.phone}%0ARole: ${user.role}%0A%0A%23new_user`
            const telegramUrl = `https://api.telegram.org/bot${propertiesProvider.getTelegramBotToken()}/sendMessage?chat_id=${propertiesProvider.getTelegramChatId()}&text=${text}`
            axios.get(telegramUrl)
                .then(() => {
                })
                .catch(() => {
                })
        }
        res.status(200).send(user)
    } catch (error) {
        res.status(400).send(error)
    }
})

//get user by id
router.get('/:id', log, auth, async (req, res) => {
    // #swagger.tags = ['Users']
    const user = await User.findOne({_id: req.params.id})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    user.password = null
    user.fcmTokens = []
    res.status(200).send(user)
})

router.post('/exists', log, async (req, res) => {
    // #swagger.tags = ['Users']
    const {email} = req.body
    const user = await User.findOne({email})

    return res.status(200).send({userExists: user !== null})
})

//update user location
router.patch('/:id/location', log, auth, async (req, res) => {
    // #swagger.tags = ['Users']
    const _id = req.params.id
    const {location} = req.body
    const user = await User.findOneAndUpdate({_id}, {location: location})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    const trip = await Trip.findOne({driverId: _id, status: {$in: ['ACTIVE', 'SCHEDULED']}})
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
    res.status(200).send()
})

//update user fcm token
router.patch('/:id/fcmToken', log, auth, async (req, res) => {
    // #swagger.tags = ['Users']
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
    // #swagger.tags = ['Users']
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
    // #swagger.tags = ['Users']
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
    // #swagger.tags = ['Users']
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
    // #swagger.tags = ['Users']
    const validatorEmail = req.user.email_id
    const validator = await User.findOne({email: validatorEmail})
    if (!validator.isAdmin) {
        return res.status(403).send(Error.youNeedAdminRights)
    }
    const user = await User.findOne({_id: req.params.id})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
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
    // #swagger.tags = ['Users']
    const trips = await Trip.find({driverId: req.params.id})
    res.status(200).send(await Extensions.getResponseTripsById(trips.map(trip => trip._id)))
})

router.get('/:id/senderTrips', log, auth, async (req, res) => {
    // #swagger.tags = ['Users']
    const parcels = await Parcel.find({userId: req.params.id})

    const trips = await Trip.find()
    const responseTrips = await Promise.all(
        parcels.map(async (parcel) => {
            if (parcel.status === "CREATED" || parcel.status === "CANCELLED" || parcel.status === "REJECTED") {
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
