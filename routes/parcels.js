const express = require('express')

const {Parcel} = require('../models/parcel')
const User = require('../models/user')
const Secret = require('../models/secret')
const Trip = require('../models/trip')
const auth = require('../middleware/auth')
const log = require('../middleware/log')
const Errors = require("../errors/errors")
const Socket = require("../socket/socket")
const Error = require("../errors/errors")
const Extensions = require('../utils/extensions')

const router = express.Router()

router.post('/', log, auth, async (req, res) => {
    try {
        const {userId, startPoint, endPoint, size} = req.body

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
            size: size,
            status: 'CREATED'
        })

        const responseParcel = await Extensions.getResponseParcelById(createdParcel._id)
        user.password = null
        user.fcmTokens = []
        responseParcel.user = user
        res.status(200).send(responseParcel)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/:id', log, auth, async (req, res) => {
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
    const driver = await User.findOne({email: req.user.email_id})
    const parcelId = req.params.id
    const driverId = driver._id
    const existedParcel = await Parcel.findOne({_id: parcelId})
    if (!existedParcel) {
        return res.status(400).send(Error.noSuchParcel)
    }
    existedParcel.status = 'ACCEPTED'

    const trip = await Trip.findOne({driverId, status: 'ACTIVE'})
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

    const responseParcel = await Extensions.getResponseParcelById(parcelId)

    res.status(200).send(responseParcel)
})

router.post('/:id/decline', log, auth, async (req, res) => {
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
    await Parcel.updateOne({_id: parcelId}, parcel)
    res.status(200).send(parcel)
})

router.post('/:id/cancel', log, auth, async (req, res) => {
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

router.post('/:id/deliver', log, auth, async (req, res) => {
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
    await Parcel.updateOne({_id: parcelId}, parcel)
    res.status(200).send(parcel)
})

router.post('/:id/secret', log, auth, async (req, res) => {
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