const express = require('express')
const Trip = require('../models/trip')
const User = require('../models/user')
const Error = require('../errors/errors')
const auth = require('../middleware/auth')

const router = express.Router()

//create trip
router.post('/', auth, async (req, res) => {
    try {
        const {driverId, startPoint, endPoint, driverLocation} = req.body

        if (startPoint.latitude === endPoint.latitude && startPoint.longitude === endPoint.longitude) {
            return res.status(400).send(Error.pointsAreTheSame)
        }
        const user = await User.findOne({_id: driverId})
        if (!user) {
            return res.status(400).send(Error.noSuchUser)
        }

        if (!user.isDriver) {
            return res.status(400).send(Error.notADriver)
        }

        const activeTrip = await Trip.findOne({driverId: driverId, status: 'ACTIVE'})
        if (activeTrip !== null) {
            return res.status(400).send(Error.driverHasActiveTrip)
        }

        const trip = await Trip.create({
            driverId: driverId,
            startPoint: startPoint,
            endPoint: endPoint,
            driverLocation: driverLocation,
            status: 'ACTIVE',
            parcels: []
        })

        const tripResponse = trip.toObject()
        user.password = null
        user.fcmTokens = []
        tripResponse.driver = user

        res.status(200).send(tripResponse)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/:id/complete', auth, async (req, res) => {
    const trip = await Trip.findOneAndUpdate({_id: req.params.id}, {status: 'COMPLETED'})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    res.status(200).send()
})

router.post('/:id/cancel', auth, async (req, res) => {
    const trip = await Trip.findOneAndUpdate({_id: req.params.id}, {status: 'CANCELLED'})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    res.status(200).send()
})

module.exports = router