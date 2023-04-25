const express = require('express')
const mongoose = require('mongoose')
const Trip = require('../models/trip')
const User = require('../models/user')
const Error = require('../errors/errors')
const sendPushNotification = require('../firebase/push/fcm')

const router = express.Router()

const MAX_DISTANCE = 15.0

router.get('/', async (req, res) => {
    try {
        const trips = await Trip.find()
        res.status(200).send(trips)
    } catch (error) {
        res.status(500).send(error)
    }
})

router.post('/', async (req, res) => {
    try {
        const driver = req.body["driver"]
        const startPoint = req.body["startPoint"]
        const endPoint = req.body["endPoint"]

        const isValidId = mongoose.Types.ObjectId.isValid(driver)

        if (isValidId) {
            if (startPoint.latitude === endPoint.latitude && startPoint.longitude === endPoint.longitude) {
                res.status(404).send(Error.pointsAreTheSame)
            } else {
                const user = await User.findOne({_id: driver})

                if (user != null) {
                    const trip = new Trip(req.body)
                    await trip.save()
                    res.status(200).send(trip)
                } else {
                    res.status(404).send(Error.noSuchUser)
                }
            }
        } else {
            res.status(404).send(Error.noSuchUser)
        }
    } catch (error) {
        res.status(400).send(error)
    }
})

router.post('/find', async (req, res) => {
    const startPoint = req.body["startPoint"]
    const endPoint = req.body["endPoint"]

    const drivers = await User.find({isActive: true, isDriver: true})
    const driversAbleToStart = drivers.filter(driver => getDistanceBetween(startPoint, driver.location) < MAX_DISTANCE)

    const trips = await Trip.find()
    const driversWithSameEnd = trips
        .filter(trip => getDistanceBetween(endPoint, trip.endPoint) < MAX_DISTANCE)
        .map(trip => trip.driver)

    const driversAbleToFinish = driversAbleToStart
        .filter(driver => driversWithSameEnd.includes(driver._id.toHexString()))

    driversAbleToFinish.forEach(driver => sendPushNotification(driver.fcmToken, "New order to:", endPoint.cityName))

    res.status(200).send(driversAbleToFinish)
})

function getDistanceBetween(point1, point2) {
    return getDistanceFromLatLonInKm(point1.latitude, point1.longitude, point2.latitude, point2.longitude)
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)  // deg2rad below
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    return d
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

module.exports = router