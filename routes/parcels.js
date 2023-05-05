const express = require('express')

const {Parcel} = require('../models/parcel')
const User = require('../models/user')
const Secret = require('../models/secret')
const Trip = require('../models/trip')
const auth = require('../middleware/auth')
const Errors = require("../errors/errors");
const Socket = require("../socket/socket");

const router = express.Router()

router.post('/', auth, async (req, res) => {
    try {
        const {userId, startPoint, endPoint, size} = req.body

        const user = await User.findOne({_id: userId})

        if (user === null) {
            return res.status(400).send(Errors.noSuchUser)
        }

        const createdParcel = await Parcel.create({
            userId: userId,
            startPoint: startPoint,
            endPoint: endPoint,
            size: size,
            status: 'CREATED'
        })

        const responseParcel = createdParcel.toObject()
        user.password = null
        responseParcel.user = user
        res.status(200).send(responseParcel)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/:id', auth, async (req, res) => {
    const parcel = await Parcel.findOne({_id: req.params.id})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    const user = await User.findOne({_id: parcel.userId})
    if (user === null) {
        return res.status(400).send(Errors.noSuchUser)
    }

    const responseParcel = parcel.toObject()
    user.password = null
    responseParcel.user = user
    res.status(200).send(responseParcel)
})

router.post('/:id/pickup', auth, async (req, res) => {
    const driver = await User.findOne({email: req.user.email_id})
    const parcelId = req.params.id
    const {tripId} = req.body

    const trips = await Trip.find()
    const trip = trips.find(trip => trip.parcels.map(parcel => parcel._id.toString()).includes(parcelId))

    const parcel = await Parcel.findOne({_id: parcelId})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    if (tripId !== trip._id.toString() && driver._id.toString() !== trip.driverId) {
        return res.status(400).send(Errors.accessDenied)
    }

    parcel.status = 'PICKED'
    Socket.emitEvent(parcel.userId, "parcelPicked", parcel)
    await Parcel.updateOne({_id: parcelId}, parcel)
    res.status(200).send(parcel)
})

router.post('/:id/deliver', auth, async (req, res) => {
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

router.post('/:id/secret', auth, async (req, res) => {
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

router.get('/:id/secret', auth, async (req, res) => {
    const secret = await Secret.findOne({parcelId: req.params.id})

    if (secret === null) {
        return res.status(400).send(Errors.noSecretForThisParcel)
    }

    const user = await User.findOne({email: req.user.email_id})
    if (secret.userId !== user._id) {
        return res.status(400).send(Errors.accessDenied)
    }

    res.status(200).send(secret)
})

module.exports = router