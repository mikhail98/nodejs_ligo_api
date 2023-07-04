const axios = require("axios")
const express = require('express')
const Trip = require('../models/trip')
const User = require('../models/user')
const log = require('../middleware/log')
const Error = require("../errors/errors")
const Parcel = require('../models/parcel')
const Secret = require('../models/secret')
const auth = require('../middleware/auth')
const Errors = require("../errors/errors")
const Socket = require("../socket/socket")
const Extensions = require('../utils/extensions')
const sendPushNotifications = require("../firebase/fcm")
const propertiesProvider = require("../utils/propertiesProvider")
const {getTelegramChatId} = require("../utils/propertiesProvider");

const router = express.Router()

router.post('/', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    try {
        const {userId, startPoint, endPoint, types, weight, price} = req.body

        if (startPoint.latitude === endPoint.latitude && startPoint.longitude === endPoint.longitude) {
            return res.status(400).send(Error.pointsAreTheSame)
        }

        const user = await User.findOne({_id: userId})

        if (!user) {
            return res.status(400).send(Errors.noSuchUser)
        }

        const createdParcel = await Parcel.create({
            userId: userId,
            startPoint: startPoint,
            endPoint: endPoint,
            status: 'CREATED',
            types: types,
            price: price,
            weight: weight
        })

        await Extensions.requestDriverForParcel(createdParcel._id)
        const responseParcel = await Extensions.getResponseParcelById(createdParcel._id)
        user.password = null
        user.fcmTokens = []
        responseParcel.user = user

        const text = `New parcel!!! 📦📦📦%0A%0AId: ${createdParcel._id}%0ARoute: ${startPoint.cityName} -> ${endPoint.cityName}%0A%0A%23new_parcel`
        const telegramUrl = `https://api.telegram.org/bot${propertiesProvider.getTelegramBotToken()}/sendMessage?chat_id=${getTelegramChatId()}&text=${text}`
        axios.get(telegramUrl)
            .then(() => {
            })
            .catch(() => {
            })
        res.status(200).send(responseParcel)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/:id', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const parcel = await Parcel.findOne({_id: req.params.id})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    const user = await User.findOne({_id: parcel.userId})
    if (!user) {
        return res.status(400).send(Errors.noSuchUser)
    }

    const responseParcel = parcel.toObject()
    user.password = null
    user.fcmTokens = []
    responseParcel.user = user
    res.status(200).send(responseParcel)
})

router.post('/:id/accept', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const driver = await User.findOne({email: req.user.email_id})
    const parcelId = req.params.id
    const driverId = driver._id
    const existedParcel = await Parcel.findOne({_id: parcelId})
    if (!existedParcel) {
        return res.status(400).send(Error.noSuchParcel)
    }
    existedParcel.status = 'ACCEPTED'

    const trip = await Trip.findOne({driverId, status: {$in: ['ACTIVE', 'SCHEDULED']}})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    trip.parcels.push(parcelId)

    await Trip.updateOne({_id: trip._id}, trip)
    await Parcel.updateOne({_id: parcelId}, existedParcel)

    const responseTrip = trip.toObject()
    responseTrip.parcels = await Promise.all(
        trip.parcels.map(async (parcelId) => {
                return await Extensions.getResponseParcelById(parcelId)
            }
        )
    )
    const user = await User.findOne({_id: driverId})
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseTrip.driver = user

    Socket.emitEvent(existedParcel.userId, 'parcelAccepted', responseTrip)
    await sendPushNotifications(existedParcel.userId, {
        key: "PARCEL_ACCEPTED",
        parcelId: parcelId.toString()
    })

    const responseParcel = await Extensions.getResponseParcelById(parcelId)

    res.status(200).send(responseParcel)
})

router.post('/:id/decline', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const driver = await User.findOne({email: req.user.email_id})
    const parcelId = req.params.id
    const driverId = driver._id
    const existedParcel = await Parcel.findOne({_id: parcelId})
    if (!existedParcel) {
        return res.status(400).send(Error.noSuchParcel)
    }
    existedParcel.driversBlacklist.push(driverId)
    await Parcel.updateOne({_id: parcelId}, existedParcel)
    res.status(200).send(existedParcel)
})

router.post('/:id/pickup', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const driver = await User.findOne({email: req.user.email_id})
    const parcelId = req.params.id
    const {tripId} = req.body

    const trips = await Trip.find()
    const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcelId))

    const parcel = await Parcel.findOne({_id: parcelId})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    if (tripId !== trip._id.toString() && driver._id.toString() !== trip.driverId) {
        return res.status(400).send(Errors.notInYouTrip)
    }

    parcel.status = 'PICKED'
    Socket.emitEvent(parcel.userId, "parcelPicked", parcel)
    await sendPushNotifications(parcel.userId, {
        key: "PARCEL_PICKED",
        parcelId: parcelId.toString()
    })
    await Parcel.updateOne({_id: parcelId}, parcel)
    res.status(200).send(parcel)
})

router.post('/:id/cancel', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const parcelId = req.params.id

    const trips = await Trip.find()
    const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcelId))

    const parcel = await Parcel.findOne({_id: parcelId})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    if (trip) {
        return res.status(400).send(Errors.parcelInActiveTrip)
    }

    parcel.status = 'CANCELLED'
    parcel.notifiedDrivers.forEach(driverId => {
        Socket.emitEvent(driverId, "parcelCancelled", parcel)
    })
    await Parcel.updateOne({_id: parcelId}, parcel)
    res.status(200).send(parcel)
})

router.post('/:id/reject', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const parcelId = req.params.id
    const {rejectReason, rejectComment, rejectPhotoUrl} = req.body

    const trips = await Trip.find()
    const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcelId))

    const parcel = await Parcel.findOne({_id: parcelId})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    parcel.status = 'REJECTED'
    parcel.rejectReason = rejectReason
    parcel.rejectComment = rejectComment
    parcel.rejectPhotoUrl = rejectPhotoUrl
    Socket.emitEvent(parcel.userId, "parcelRejected", parcel)

    await sendPushNotifications(parcel.userId, {
        key: "PARCEL_REJECTED",
        parcelId: parcelId.toString()
    })

    trip.parcels = trip.parcels.filter(id => id !== parcelId)
    await Parcel.updateOne({_id: parcelId}, parcel)
    await Trip.updateOne({_id: trip._id}, trip)
    res.status(200).send(parcel)
})

router.post('/:id/deliver', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const parcelId = req.params.id
    const {secret} = req.body

    const parcelSecret = await Secret.findOne({parcelId})

    if (parcelSecret === null) {
        return res.status(400).send(Errors.noSecretForThisParcel)
    }

    if (parcelSecret.secret !== secret) {
        return res.status(400).send(Errors.accessDenied)
    }

    const parcel = await Parcel.findOne({_id: parcelId})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    parcel.status = 'DELIVERED'
    Socket.emitEvent(parcel.userId, "parcelDelivered", parcel)

    const trips = await Trip.find()
    const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcelId))

    if (trip) {
        await sendPushNotifications(parcel.userId, {
            key: "PARCEL_DELIVERED",
            parcelId: parcelId.toString(),
            tripId: trip._id.toString()
        })
    } else {
        await sendPushNotifications(parcel.userId, {
            key: "PARCEL_DELIVERED",
            parcelId: parcelId.toString()
        })
    }

    await Parcel.updateOne({_id: parcelId}, parcel)
    res.status(200).send(parcel)
})

router.post('/:id/secret', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const user = await User.findOne({email: req.user.email_id})

    const parcelId = req.params.id
    const secret = req.body.secret

    try {
        const createdSecret = await Secret.create({
            userId: user._id,
            parcelId: parcelId,
            secret: secret
        })
        res.status(200).send(createdSecret)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/:id/secret', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']
    const secret = await Secret.findOne({parcelId: req.params.id})

    if (secret === null) {
        return res.status(400).send(Errors.noSecretForThisParcel)
    }

    const user = await User.findOne({email: req.user.email_id})
    if (secret.userId !== user._id.toString()) {
        return res.status(400).send(Errors.accessDenied)
    }

    res.status(200).send(secret)
})

module.exports = router