const Trip = require("../model/trip")
const Parcel = require("../model/parcel")
const Secret = require("../model/secret")

const Error = require("../utils/errors")
const Socket = require("../utils/socket")
const Extensions = require("../utils/extensions")

const ParcelStatues = require("../utils/config").ParcelStatues

const sendPushNotifications = require("../utils/fcm")
const sendMessageToTelegramBot = require("../utils/telegram")

class ParcelService {

    static async createParcel(user, startPoint, endPoint, types, weight, price, res) {
        if (startPoint.latitude === endPoint.latitude && startPoint.longitude === endPoint.longitude) {
            return res.status(400).send(Error.pointsAreTheSame)
        }

        return Parcel.create({
            types: types,
            price: price,
            weight: weight,
            sender: user._id,
            status: ParcelStatues.CREATED,
            endPoint: endPoint,
            notifiedDrivers: [],
            driversBlacklist: [],
            startPoint: startPoint
        })
            .then(function (parcel) {
                return Parcel.findOne({_id: parcel._id})
                    .populate("sender")
                    .then(parcel => {
                        Extensions.requestDriverForParcel(parcel._id)
                        parcel.sender.fcmTokens = []
                        const text = `New parcel!!! 📦📦📦%0A%0AId: ${parcel._id}%0ARoute: ${startPoint.cityName} -> ${endPoint.cityName}%0A%0A%23new_parcel`
                        sendMessageToTelegramBot(text)
                        return res.status(200).send(parcel)
                    })
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async createSecretForParcel(userId, parcelId, secret, res) {
        return Secret.create({userId, parcelId, secret})
            .then(secret => {
                res.status(200).send(secret)
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getSecretForParcel(userId, parcelId, res) {
        Secret.findOne({parcelId})
            .then(secret => {
                if (secret) {
                    if (secret.userId !== userId.toString()) {
                        return res.status(400).send(Error.accessDenied)
                    }

                    return res.status(200).send(secret)
                } else {
                    return res.status(400).send(Error.noSecretForThisParcel)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getParcelById(parcelId, res) {
        return Parcel.findOne({_id: parcelId})
            .populate("sender driver")
            .then(parcel => {
                if (parcel) {
                    parcel.sender.fcmTokens = []
                    if (parcel.driver) {
                        parcel.driver.fcmTokens = []
                    }
                    return res.status(200).send(parcel)
                } else {
                    return res.status(400).send(Error.noSuchParcel)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async acceptParcel(driverId, parcelId, res) {
        return Parcel.findOne({_id: parcelId})
            .populate("sender driver")
            .then(function (parcel) {
                if (parcel) {
                    return Trip.findOne({'driver._id': driverId, status: {$in: ['ACTIVE', 'SCHEDULED']}})
                        .then(trip => {
                            parcel.status = ParcelStatues.ACCEPTED
                            trip.parcels.push(parcelId)

                            return Promise.all([
                                Trip.updateOne({_id: trip._id}, trip),
                                Parcel.updateOne({_id: parcelId}, parcel)
                            ]).then(() => {
                                const senderId = parcel.sender._id.toString()

                                Socket.emitEvent(senderId, 'parcelAccepted', parcel)
                                sendPushNotifications(senderId, {key: "PARCEL_ACCEPTED", parcelId: parcelId})

                                return res.status(200).send(parcel)
                            })
                        })
                } else {
                    return res.status(400).send(Error.noSuchParcel)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async declineParcel(driverId, parcelId, res) {
        return Parcel.findOne({_id: parcelId})
            .populate("sender driver")
            .then(function (parcel) {
                if (parcel) {
                    parcel.driversBlacklist.push(driverId)
                    return Parcel.updateOne({_id: parcelId}, parcel)
                        .then(() => {
                            return res.status(200).send(parcel)
                        })
                } else {
                    return res.status(400).send(Error.noSuchParcel)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async pickupParcel(driverId, tripId, parcelId, res) {
        Trip.find()
            .then(function (trips) {
                return Parcel.findOne({_id: parcelId})
                    .populate("sender driver")
                    .then(function (parcel) {
                        if (parcel) {
                            const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcelId))
                            if (tripId === trip._id.toString() && driverId === trip.driver) {
                                parcel.status = ParcelStatues.PICKED

                                const senderId = parcel.sender._id.toString()

                                Socket.emitEvent(senderId, 'parcelPicked', parcel)
                                sendPushNotifications(senderId, {key: "PARCEL_PICKED", parcelId: parcelId})

                                return Parcel.updateOne({_id: parcelId}, parcel)
                                    .then(() => {
                                        return res.status(200).send(parcel)
                                    })
                            } else {
                                return res.status(400).send(Error.notInYouTrip)
                            }
                        } else {
                            return res.status(400).send(Error.noSuchParcel)
                        }
                    })
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async cancelParcel(driverId, parcelId, res) {
        return Parcel.findOne({_id: parcelId})
            .populate("sender driver")
            .then(function (parcel) {
                if (parcel) {
                    if (parcel.driver) {
                        return res.status(400).send(Error.parcelInActiveTrip)
                    } else {
                        parcel.status = ParcelStatues.CANCELLED
                        parcel.notifiedDrivers.forEach(driverId => {
                            Socket.emitEvent(driverId, "parcelCancelled", parcel)
                        })
                        return Parcel.updateOne({_id: parcelId}, parcel)
                            .then(() => {
                                res.status(200).send(parcel)
                            })
                    }
                } else {
                    return res.status(400).send(Error.noSuchParcel)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async rejectParcel(tripId, parcelId, rejectReason, rejectComment, rejectPhotoUrl, res) {
        Trip.findOne({_id: tripId})
            .then(function (trip) {
                if (trip) {
                    return Parcel.findOne({_id: parcelId})
                        .populate("sender driver")
                        .then(parcel => {
                            if (parcel) {
                                parcel.rejectReason = rejectReason
                                parcel.rejectComment = rejectComment
                                parcel.rejectPhotoUrl = rejectPhotoUrl
                                parcel.status = ParcelStatues.REJECTED
                                const senderId = parcel.sender._id.toString()

                                Socket.emitEvent(senderId, "parcelRejected", parcel)
                                sendPushNotifications(senderId, {key: "PARCEL_REJECTED", parcelId: parcelId})

                                trip.parcels = trip.parcels.filter(id => id !== parcelId)

                                return Promise.all([
                                    Parcel.updateOne({_id: parcelId}, parcel),
                                    Trip.updateOne({_id: trip._id}, trip)
                                ])
                                    .then(() => {
                                        return res.status(200).send(parcel)
                                    })
                            } else {
                                return res.status(400).send(Error.noSuchParcel)
                            }
                        })
                } else {
                    return res.status(400).send(Error.noSuchTrip)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async deliverParcel(tripId, parcelId, secret, res) {
        return Secret.findOne({parcelId})
            .then(function (parcelSecret) {
                if (parcelSecret) {
                    if (parcelSecret.secret === secret) {
                        return Parcel.findOneAndUpdate({_id: parcelId}, {status: ParcelStatues.DELIVERED})
                            .populate("sender driver")
                            .then((parcel) => {
                                const senderId = parcel.sender._id.toString()
                                Socket.emitEvent(senderId, "parcelDelivered", parcel)
                                sendPushNotifications(senderId, {
                                    key: "PARCEL_DELIVERED", parcelId: parcelId, tripId: tripId
                                })

                                return res.status(200).send(parcel)
                            })
                    } else {
                        return res.status(400).send(Error.accessDenied)
                    }
                } else {
                    return res.status(400).send(Error.noSecretForThisParcel)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })

    }
}

module.exports = ParcelService