const cron = require('node-cron')

const Trip = require('../model/trip')
const Parcel = require('../model/parcel')

const Socket = require('../utils/socket')

const sendPushNotifications = require("../utils/fcm")
const ParcelStatues = require('../utils/config').ParcelStatues

const MAX_DISTANCE = 15.0
let REQUEST_INTERVAL_MIN = 1
if (process.env.PROD) {
    REQUEST_INTERVAL_MIN = 5
}

class MatchingService {
    static startMatchingJob() {
        cron.schedule(`*/${REQUEST_INTERVAL_MIN} * * * *`, async () => {
            console.log("REQUEST DRIVER NOTIFY")
            await requestDriversForParcels()
        })
    }
}

async function requestDriversForParcels() {
    const activeParcels = await Parcel.find({status: ParcelStatues.CREATED}).populate("sender driver")
    activeParcels.forEach(parcel => {
        parcel.sender.fcmTokens = []
        if (parcel.driver) {
            parcel.driver.fcmTokens = []
        }
    })
    const activeTrips = await Trip.find({status: {$in: ['ACTIVE', 'SCHEDULED']}}).populate("driver parcels")
    activeTrips.forEach(trip => {
        trip.driver.fcmTokens = []
    })

    for (const parcel of activeParcels) {
        await requestDriverForParcel(parcel, activeTrips)
    }
}

async function requestDriverForParcel(parcel, activeTrips) {
    const suitableDrivers = activeTrips
        .filter(trip => trip.driver.location !== undefined)
        .filter(trip => trip.driver.location !== null)
        .filter(trip => {
            if (trip.status === 'ACTIVE') {
                return getDistanceBetween(parcel.startPoint, trip.driver.location) < MAX_DISTANCE
            }
            if (trip.status === 'SCHEDULED') {
                return getDistanceBetween(parcel.startPoint, trip.startPoint) < MAX_DISTANCE
            }
            return false
        })
        .filter(trip => getDistanceBetween(parcel.endPoint, trip.endPoint) < MAX_DISTANCE)
        .filter(trip => !parcel.driversBlacklist.includes(trip.driver._id))
        .filter(trip => !parcel.notifiedDrivers.includes(trip.driver._id))
        .map(trip => trip.driver)

    for (const driver of suitableDrivers) {
        await notifyDriver(driver, parcel)
    }
}

async function notifyDriver(driver, parcel) {
    if (!parcel.notifiedDrivers.includes(driver._id)) {
        parcel.notifiedDrivers.push(driver._id)
        await Parcel.updateOne({_id: parcel._id}, parcel)
    }

    parcel.sender.fcmTokens = []
    if (parcel.driver) {
        parcel.driver.fcmTokens = []
    }
    const driverId = driver._id.toString()
    Socket.emitEvent(driverId, "parcelAvailable", parcel)
    await sendPushNotifications(driverId, {key: "PARCEL_AVAILABLE", parcelId: parcel._id.toString()})
}

function getDistanceBetween(point1, point2) {
    const lat1 = point1.latitude
    const lon1 = point1.longitude
    const lat2 = point2.latitude
    const lon2 = point2.longitude
    const R = 6371 // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1)  // deg2rad below
    const dLon = deg2rad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

module.exports = MatchingService