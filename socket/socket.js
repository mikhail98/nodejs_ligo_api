const io = require('socket.io')
const Trip = require('../models/trip')
const User = require('../models/user')
const {Parcel} = require('../models/parcel')
const sendPushNotification = require("../firebase/push/fcm")

const MAX_DISTANCE = 15.0

let socketServer

function initSocket(server) {
    socketServer = new io.Server(server)

    socketServer.on('connection', socket => {

        socket.on('enterSocket', (data) => {
            socket.join(data.userId)
            emitEvent(data.userId, "socketEntered", {isSuccess: true})
        })
        socket.on('leaveSocket', (data) => {
            socket.leave(data.userId)
        })
        socket.on('requestDriverForParcel', (data) => {
            requestDriverForParcel(data.parcelId)
        })
        socket.on('acceptParcel', (data) => {
            acceptParcel(data.driverId, data.parcelId)
        })
        socket.on('declineParcel', (data) => {
            declineParcel(data.driverId, data.parcelId)
        })
    })
}

function emitEvent(userId, eventName, data) {
    socketServer.to(userId).emit(eventName, data)
    console.log("emmited " + eventName + " to " + userId)
}

async function requestDriverForParcel(parcelId) {
    const existedParcel = await Parcel.findOne({_id: parcelId})
    if (!existedParcel) {
        return
    }
    const trips = await Trip.find({status: 'ACTIVE'})
    const suitableDriverIds = trips
        .filter(trip => getDistanceBetween(existedParcel.startPoint, trip.driverLocation) < MAX_DISTANCE)
        .filter(trip => getDistanceBetween(existedParcel.endPoint, trip.endPoint) < MAX_DISTANCE)
        .filter(trip => !existedParcel.driversBlacklist.includes(trip.driverId))
        .filter(trip => !existedParcel.notifiedDrivers.includes(trip.driverId))
        .map(trip => trip.driverId)

    console.log(suitableDriverIds)
    const suitableDrivers = await User.find({_id: {$in: suitableDriverIds}})
    suitableDrivers.forEach(driver => notifyDriver(driver, existedParcel))
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

    emitEvent(driver._id.toString(), "parcelAvailable", responseParcel)
    driver.fcmTokens.forEach(token => {
        sendPushNotification(token, {
            key: "PARCEL_AVAILABLE",
            parcel: JSON.stringify(responseParcel)
        })
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

async function acceptParcel(driverId, parcelId) {
    const existedParcel = await Parcel.findOne({_id: parcelId})
    if (!existedParcel) {
        return
    }
    existedParcel.status = 'ACCEPTED'

    const trip = await Trip.findOne({driverId, status: 'ACTIVE'})
    if (!trip) {
        return
    }
    trip.parcels.push(parcelId)

    await Trip.updateOne({_id: trip._id}, trip)
    await Parcel.updateOne({_id: parcelId}, existedParcel)

    const responseTrip = trip.toObject()
    responseTrip.parcels = await Promise.all(
        trip.parcels.map(async (parcelId) => {
                return getParcelWithUserById(parcelId)
            }
        )
    )
    const user = await User.findOne({_id: driverId})
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseTrip.driver = user

    emitEvent(existedParcel.userId, 'parcelAccepted', responseTrip)
}

async function declineParcel(driverId, parcelId) {
    const existedParcel = await Parcel.findOne({_id: parcelId})
    if (!existedParcel) {
        return
    }
    existedParcel.driversBlacklist.push(driverId)
    await Parcel.updateOne({_id: parcelId}, existedParcel)
}

async function getParcelWithUserById(parcelId) {
    const parcel = await Parcel.findOne({_id: parcelId})
    const user = await User.findOne({_id: parcel.userId})
    const responseParcel = parcel.toObject()
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseParcel.user = user
    return responseParcel
}

module.exports = {
    initSocket, emitEvent
}
