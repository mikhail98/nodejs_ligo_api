const User = require("../models/user");
const Trip = require("../models/trip");
const socket = require('../socket/socket')
const Parcel = require("../models/parcel");
const sendPushNotifications = require("../firebase/fcm")

const MAX_DISTANCE = 15.0

async function getResponseTripsById(tripIdList) {
    return await Promise.all(tripIdList.map(async (tripId) => await getResponseTripById(tripId)))
}

async function getResponseTripById(_id) {
    const responseTrip = (await Trip.findOne({_id})).toObject()
    responseTrip.parcels = await Promise.all(
        responseTrip.parcels.map(async (parcelId) => {
            return await getResponseParcelById(parcelId)
        })
    )
    const user = await User.findOne({_id: responseTrip.driverId})
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseTrip.driver = user
    return responseTrip
}

async function getResponseParcelById(_id) {
    const responseParcel = (await Parcel.findOne({_id})).toObject()
    const user = await User.findOne({_id: responseParcel.userId})
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseParcel.user = user
    return responseParcel
}

async function requestDriverForParcel(parcelId) {
    try {
        const existedParcel = await Parcel.findOne({_id: parcelId})
        if (!existedParcel) {
            return
        }

        const trips = await Trip.find({status: {$in: ['ACTIVE', 'SCHEDULED']}})
        const responseTrips = await getResponseTripsById(trips.map(trip => trip._id))
        const suitableDriverIds = responseTrips
            .filter(trip => trip.driver)
            .filter(trip => trip.driver.location !== null)
            .filter(trip => {
                if (trip.status === 'ACTIVE') {
                    return getDistanceBetween(existedParcel.startPoint, trip.driver.location) < MAX_DISTANCE
                }
                if (trip.status === 'SCHEDULED') {
                    return getDistanceBetween(existedParcel.startPoint, trip.startPoint) < MAX_DISTANCE
                }
                return false
            })
            .filter(trip => getDistanceBetween(existedParcel.endPoint, trip.endPoint) < MAX_DISTANCE)
            .filter(trip => !existedParcel.driversBlacklist.includes(trip.driverId))
            .filter(trip => !existedParcel.notifiedDrivers.includes(trip.driverId))
            .map(trip => trip.driverId)

        const suitableDrivers = await User.find({_id: {$in: suitableDriverIds}})
        suitableDrivers.forEach(driver => notifyDriver(driver, existedParcel))
    } catch (e) {
        console.log(e)
    }
}

async function notifyDriver(driver, parcel) {
    if (!parcel.notifiedDrivers.includes(driver._id)) {
        parcel.notifiedDrivers.push(driver._id)
    }
    await Parcel.updateOne({_id: parcel._id}, parcel)

    const responseParcel = parcel.toObject()
    const user = await User.findOne({_id: parcel.userId})
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseParcel.user = user

    socket.emitEvent(driver._id.toString(), "parcelAvailable", responseParcel)
    await sendPushNotifications(driver._id, {
        key: "PARCEL_AVAILABLE",
        parcelId: responseParcel._id.toString()
    })
}

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
    return R * c
}

function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

module.exports = {
    getResponseTripsById, getResponseTripById, getResponseParcelById, requestDriverForParcel
}