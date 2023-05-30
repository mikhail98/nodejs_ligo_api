const express = require('express')
const cron = require('node-cron')
const Trip = require('../models/trip')
const User = require('../models/user')
const Error = require('../errors/errors')
const auth = require('../middleware/auth')
const log = require('../middleware/log')
const sendPushNotifications = require("../firebase/fcm");
const Extensions = require("../utils/extensions");

const router = express.Router()

let cronList = []

class CronItem {
    constructor(cronJob, tripId) {
        this.cronJob = cronJob
        this.tripId = tripId
    }
}

//create trip
router.post('/', log, async (req, res) => {
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
            const cronJob = cron.schedule(`${second} ${minute} ${hour} ${day} ${month} *`, async () => {
                await sendPushNotifications(driverId, {
                    key: "START_TRIP_REMINDER",
                    tripId: trip._id.toString()
                })
            }, {timezone: "Etc/GMT"})

            cronList.push(new CronItem(cronJob, trip._id))
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

router.get('/:id', log, auth, async (req, res) => {
    const trip = await Trip.findOne({_id: req.params.id})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    const responseTrip = await Extensions.getResponseTripById(trip._id)
    res.status(200).send(responseTrip)
})

router.post('/:id/start', log, auth, async (req, res) => {
    const trip = await Trip.findOneAndUpdate({_id: req.params.id}, {status: 'ACTIVE'})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    res.status(200).send()
})

router.post('/:id/complete', log, auth, async (req, res) => {
    const trip = await Trip.findOneAndUpdate({_id: req.params.id}, {status: 'COMPLETED'})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    res.status(200).send()
})

router.post('/:id/cancel', log, auth, async (req, res) => {
    const tripId = req.params.id
    const trip = await Trip.findOneAndUpdate({_id: tripId}, {status: 'CANCELLED'})
    if (!trip) {
        return res.status(400).send(Error.noSuchTrip)
    }
    const job = cronList.find(cronItem => cronItem.tripId === tripId)
    if (job) {
        job.cancel()
        cronList = cronList.filter(cronItem => cronItem !== job)
    }

    res.status(200).send()
})

module.exports = router