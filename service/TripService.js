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

        Trip.findOne({driver: user._id, status: {$in: ['ACTIVE', 'SCHEDULED']}})
            .then(function (trip) {
                if (trip) {
                    return res.status(400).send(Error.driverHasActiveTrip)
                } else {
                    let status
                    if (date) {
                        status = 'SCHEDULED'
                    } else {
                        status = 'ACTIVE'
                    }
                    return Trip.create({driver: user._id, startPoint, endPoint, status, parcels: []})
                        .then(trip => {
                            if (date) {
                                const second = date.second
                                const minute = date.minute
                                const hour = date.hour
                                const day = date.day
                                const month = date.month
                                const cronJob = cron.schedule(`${second} ${minute} ${hour} ${day} ${month} *`, async () => {
                                    await sendPushNotifications(user._id, {
                                        key: "START_TRIP_REMINDER",
                                        tripId: trip._id.toString()
                                    })
                                }, {timezone: "Etc/GMT"})

                                cronList.push(new CronItem(cronJob, trip._id))
                            }

                            const text = `New trip!!! 🚗🚗🚗%0A%0AId: ${trip._id}%0ARoute: ${startPoint.cityName} -> ${endPoint.cityName}%0A%0A%23new_trip`
                            sendMessageToTelegramBot(text)

                            return Trip.findOne({_id: trip._id})
                                .populate("driver")
                                .then(trip => {
                                    return res.status(200).send(trip)
                                })
                        })
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(error)
            })
    }

    static async cancelTrip(tripId, res) {
        Trip.findOneAndUpdate({_id: tripId}, {status: 'CANCELLED'})
            .then(trip => {
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
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getTripById(tripId, res) {
        Trip.findOne({_id: tripId})
            .populate("driver parcels")
            .then(trip => {
                if (trip) {
                    return res.status(200).send(trip)
                } else {
                    return res.status(400).send(Error.noSuchTrip)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async completeTrip(tripId, res) {
        Trip.findOneAndUpdate({_id: tripId}, {status: 'COMPLETED'})
            .then(trip => {
                if (trip) {
                    return res.status(200).send()
                } else {
                    return res.status(400).send(Error.noSuchTrip)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async startTrip(tripId, res) {
        Trip.findOneAndUpdate({_id: tripId}, {status: 'ACTIVE'})
            .then(trip => {
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
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
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