const cron = require('node-cron')
const Trip = require('../model/trip')

const Error = require('../utils/errors')

const sendPushNotifications = require("../utils/fcm")
const sendMessageToTelegramBot = require('../utils/telegram')

class TripService {

    static async createTrip(user, startPoint, endPoint, date, res) {
        if (startPoint.latitude === endPoint.latitude && startPoint.longitude === endPoint.longitude) {
            return res.status(400).send(Error.pointsAreTheSame)
        }

        const activeTrip = await Trip.findOne({driver: user._id, status: {$in: ['ACTIVE', 'SCHEDULED']}})
        if (activeTrip) {
            return res.status(400).send(Error.driverHasActiveTrip)
        } else {
            let status
            if (date) {
                status = 'SCHEDULED'
            } else {
                status = 'ACTIVE'
            }
            let trip = await Trip.create({driver: user._id, startPoint, endPoint, status, parcels: []})
            if (date) {
                const second = date.second
                const minute = date.minute
                const hour = date.hour
                const day = date.day
                const month = date.month
                const cronJob = cron.schedule(`${second} ${minute} ${hour} ${day} ${month} *`, async () => {
                    await sendPushNotifications(user._id, {
                        key: "START_TRIP_REMINDER", tripId: trip._id.toString()
                    })
                }, {timezone: "Etc/GMT"})

                cronList.push(new CronItem(cronJob, trip._id))
            }

            const text = `New trip!!! 🚗🚗🚗%0A%0AId: ${trip._id}%0ARoute: ${startPoint.cityName} -> ${endPoint.cityName}%0A%0A%23new_trip`
            await sendMessageToTelegramBot(text)

            trip = await Trip.findOne({_id: trip._id}).populate("driver")
            trip.driver.fcmTokens = []
            return res.status(200).send(trip)
        }
    }

    static async cancelTrip(tripId, res) {
        const trip = await Trip.findOneAndUpdate({_id: tripId}, {status: 'CANCELLED'})
        if (trip) {
            const job = cronList.find(cronItem => cronItem.tripId === tripId)
            if (job) {
                job.cancel()
                cronList = cronList.filter(cronItem => cronItem !== job)
            }

            return res.status(200).send()
        } else {
            return res.status(400).send(Error.noSuchTrip)
        }
    }

    static async getTripById(tripId, res) {
        const trip = await Trip.findOne({_id: tripId}).populate("driver parcels")
        if (trip) {
            trip.driver.fcmTokens = []
            return res.status(200).send(trip)
        } else {
            return res.status(400).send(Error.noSuchTrip)
        }
    }

    static async completeTrip(tripId, res) {
        const trip = await Trip.findOneAndUpdate({_id: tripId}, {status: 'COMPLETED'})
        if (trip) {
            return res.status(200).send()
        } else {
            return res.status(400).send(Error.noSuchTrip)
        }
    }

    static async startTrip(tripId, res) {
        const trip = await Trip.findOneAndUpdate({_id: tripId}, {status: 'ACTIVE'})
        if (trip) {
            const job = cronList.find(cronItem => cronItem.tripId === tripId)
            if (job) {
                job.cancel()
                cronList = cronList.filter(cronItem => cronItem !== job)
            }
            res.status(200).send()
        } else {
            return res.status(400).send(Error.noSuchTrip)
        }
    }
}

let cronList = []

class CronItem {
    constructor(cronJob, tripId) {
        this.cronJob = cronJob
        this.tripId = tripId
    }
}

module.exports = TripService