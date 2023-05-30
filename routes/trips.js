const express = require('express')
const cron = require('node-cron')
const Trip = require('../models/trip')
const User = require('../models/user')
const Error = require('../errors/errors')
const auth = require('../middleware/auth')
const log = require('../middleware/log')

const router = express.Router()

//create trip
router.post('/', log, auth, async (req, res) => {
    try {
        const {driverId, startPoint, endPoint, date} = req.body

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

        const activeTrip = await Trip.findOne({driverId, status: {$in: ['ACTIVE', 'SCHEDULED']}})
        if (activeTrip !== null) {
            return res.status(400).send(Error.driverHasActiveTrip)
        }

        let status
        if (date) {
            status = 'SCHEDULED'
        } else {
            status = 'ACTIVE'
        }

        const trip = await Trip.create({driverId, startPoint, endPoint, status, parcels: []})

        if (date) {
            const second = date.second
            const minute = date.minute
            const hour = date.hour
            const day = date.day
            const month = date.month
            cron.schedule(`${second} ${minute} ${hour} ${day} ${month} *`, () => {
                console.log(`Send push to ${driverId}`)
            })
        }

        const tripResponse = trip.toObject()
        user.password = null
        user.fcmTokens = []
        tripResponse.driver = user

        res.status(200).send(tripResponse)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/:id/complete', log, auth, async (req, res) => {
    const trip = await Trip.findOneAndUpdate({_id: req.params.id}, {status: 'COMPLETED'})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    res.status(200).send()
})

router.post('/:id/cancel', log, auth, async (req, res) => {
    const trip = await Trip.findOneAndUpdate({_id: req.params.id}, {status: 'CANCELLED'})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    res.status(200).send()
})

module.exports = router