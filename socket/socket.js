const io = require('socket.io')
const Trip = require('../models/trip')
const User = require('../models/user')
const {Parcel} = require('../models/parcel')
const sendPushNotification = require("../firebase/push/fcm")

const socketConnections = []

const MAX_DISTANCE = 15.0

function initSocket(server) {
    const socketServer = new io.Server(server)

    socketServer.on('connection', socket => {
        socket.on('enterSocket', (data) => {

            const userId = data.userId
            const socketInstance = {socket: socket, _id: userId}

            const connection = socketConnections.find(si => si._id === userId)

            if (connection !== null) {
                socketConnections.splice(socketConnections.indexOf(connection))
            }

            socketConnections.push(socketInstance)

            emitEvent(userId, "socketEntered", {isSuccess: true})
        })
        socket.on('requestDriverForParcel', (data) => {
            requestDriverForParcel(data.parcel)
        })
        socket.on('acceptParcel', (data) => {
            acceptParcel(data.driver, data.parcel)
        })
        socket.on('declineParcel', (data) => {
            declineParcel(data.driver, data.parcel)
        })
    })
}

function emitEvent(userId, eventName, data) {
    const socketConnection = socketConnections.find(connection => connection._id === userId)

    if (!socketConnection) {
        return
    }

    console.log("emmited " + eventName + " to " + userId)

    socketConnection.socket.emit(eventName, data)
}

async function requestDriverForParcel(parcel) {
    const existedParcel = await Parcel.findOne({_id: parcel})
    console.log("requestDriverForParcel")
    if (!existedParcel) {
        return
    }
    const trips = await Trip.find({status: 'ACTIVE'})
    const suitableDriverIds = trips
        .filter(trip => getDistanceBetween(existedParcel.startPoint, trip.driverLocation) < MAX_DISTANCE)
        .filter(trip => getDistanceBetween(existedParcel.endPoint, trip.endPoint) < MAX_DISTANCE)
        .filter(trip => !existedParcel.driversBlacklist.includes(trip.driver))
        .filter(trip => !existedParcel.notifiedDrivers.includes(trip.driver))
        .map(trip => trip.driver)

    const suitableDrivers = await User.find({ '_id': { $in: suitableDriverIds } })
    suitableDrivers.forEach(driver => notifyDriver(driver, existedParcel))
}

async function notifyDriver(driver, parcel) {
    if (!parcel.notifiedDrivers.includes(driver._id)) {
        parcel.notifiedDrivers.push(driver._id)
    }
    await Parcel.updateOne({_id: parcel._id}, parcel)
    emitEvent(driver._id.toString(), "parcelAvailable", parcel)
    if (driver.fcmToken) {
        sendPushNotification(driver.fcmToken, {
            key: "PARCEL_AVAILABLE",
            parcel: parcel.toString()
        })
    }
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

async function acceptParcel(driver, parcel) {
    const existedParcel = await Parcel.findOne({_id: parcel})
    if (!existedParcel) {
        return
    }
    existedParcel.status = 'ACCEPTED'

    const trip = await Trip.findOne({driver, status: 'ACTIVE'})
    if (!trip) {
        return
    }
    trip.parcels.push(existedParcel)

    await Trip.updateOne({driver: trip.driver}, trip)
    await Parcel.updateOne({_id: parcel}, existedParcel)

    emitEvent(existedParcel.user.toString(), 'parcelAccepted', trip)
}

async function declineParcel(driver, parcel) {
    const existedParcel = await Parcel.findOne({_id: parcel})
    if (!existedParcel) {
        return
    }
    existedParcel.driversBlacklist.push(driver)
    await Parcel.updateOne({_id: parcel}, existedParcel)
}

module.exports = {
    initSocket, emitEvent
}
