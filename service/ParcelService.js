const Trip = require("../model/trip")
const Parcel = require("../model/parcel")
const Secret = require("../model/secret")

const Error = require("../utils/errors")
const Socket = require("../utils/socket")

const ParcelStatues = require("../utils/config").ParcelStatues
const ChatService = require("../service/ChatService")
const GoogleService = require("../service/GoogleService")

const sendPushNotifications = require("../utils/fcm")
const sendMessageToTelegramBot = require("../utils/telegram")

class ParcelService {
    static async createParcel(user, startPoint, endPoint, types, weight, price, secret, res) {
        if (startPoint.latitude === endPoint.latitude && startPoint.longitude === endPoint.longitude) {
            return res.status(400).send(Error.pointsAreTheSame)
        }

        let parcel = await Parcel.create({
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

        await Secret.create({userId: user._id, parcelId: parcel._id, secret})
        parcel = await Parcel.findOne({_id: parcel._id}).populate("sender")
        parcel.sender.fcmTokens = []
        if (parcel.driver) {
            parcel.driver.fcmTokens = []
        }

        const text = `New parcel!!! 📦📦📦%0A%0AId: ${parcel._id}%0ARoute: ${startPoint.cityName} -> ${endPoint.cityName}%0A%0A%23new_parcel`
        await sendMessageToTelegramBot(text)

        return res.status(200).send(parcel)
    }

    static async getSecretForParcel(userId, parcelId, res) {
        const secret = await Secret.findOne({parcelId})
        if (secret) {
            if (secret.userId !== userId.toString()) {
                return res.status(400).send(Error.accessDenied)
            }

            return res.status(200).send(secret)
        } else {
            return res.status(400).send(Error.noSecretForThisParcel)
        }
    }

    static async getParcelById(parcelId, res) {
        const parcel = await Parcel.findOne({_id: parcelId}).populate("sender driver")
        if (parcel) {
            parcel.sender.fcmTokens = []
            if (parcel.driver) {
                parcel.driver.fcmTokens = []
            }
            return res.status(200).send(parcel)
        } else {
            return res.status(400).send(Error.noSuchParcel)
        }
    }

    static async acceptParcel(driverId, parcelId, res) {
        const parcel = await Parcel.findOneAndUpdate(
            {_id: parcelId},
            {driver: driverId, status: ParcelStatues.ACCEPTED},
            {new: true}
        )
            .populate("driver sender")

        await ChatService.createChat(parcelId, driverId, parcel.sender._id)

        if (parcel) {
            const trip = await Trip.findOne({driver: driverId, status: {$in: ['ACTIVE', 'SCHEDULED']}})
            trip.parcels.push(parcelId)
            await Trip.updateOne({_id: trip._id}, trip)
            parcel.sender.fcmTokens = []
            if (parcel.driver) {
                parcel.driver.fcmTokens = []
            }

            const senderId = parcel.sender._id.toString()
            Socket.emitEvent(senderId, 'parcelAccepted', parcel)
            await sendPushNotifications(senderId, {key: "PARCEL_ACCEPTED", parcelId: parcel._id})

            return res.status(200).send(parcel)
        } else {
            return res.status(400).send(Error.noSuchParcel)
        }
    }

    static async declineParcel(driverId, parcelId, res) {
        const parcel = await Parcel.findOne({_id: parcelId}).populate("sender driver")
        if (parcel) {
            parcel.driversBlacklist.push(driverId)
            await Parcel.updateOne({_id: parcelId}, parcel)

            parcel.sender.fcmTokens = []
            if (parcel.driver) {
                parcel.driver.fcmTokens = []
            }
            return res.status(200).send(parcel)
        } else {
            return res.status(400).send(Error.noSuchParcel)
        }
    }

    static async pickupParcel(driverId, parcelId, res) {
        const trips = await Trip.find()
        const parcel = await Parcel.findOne({_id: parcelId}).populate("sender driver")
        if (parcel) {
            const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcelId))
            if (driverId.toString() === trip.driver.toString()) {
                parcel.status = ParcelStatues.PICKED
                await Parcel.updateOne({_id: parcelId}, parcel)

                parcel.sender.fcmTokens = []
                if (parcel.driver) {
                    parcel.driver.fcmTokens = []
                }
                const senderId = parcel.sender._id.toString()
                Socket.emitEvent(senderId, 'parcelPicked', parcel)
                await sendPushNotifications(senderId, {key: "PARCEL_PICKED", parcelId: parcel._id})
                return res.status(200).send(parcel)
            } else {
                return res.status(400).send(Error.notInYouTrip)
            }
        } else {
            return res.status(400).send(Error.noSuchParcel)
        }
    }

    static async cancelParcel(driverId, parcelId, res) {
        const parcel = await Parcel.findOne({_id: parcelId}).populate("sender driver")
        if (parcel) {
            if (parcel.driver) {
                return res.status(400).send(Error.parcelInActiveTrip)
            } else {
                parcel.status = ParcelStatues.CANCELLED
                await Parcel.updateOne({_id: parcelId}, parcel)

                parcel.sender.fcmTokens = []
                if (parcel.driver) {
                    parcel.driver.fcmTokens = []
                }
                parcel.notifiedDrivers.forEach(driverId => {
                    Socket.emitEvent(driverId, "parcelCancelled", parcel)
                })

                return res.status(200).send(parcel)
            }
        } else {
            return res.status(400).send(Error.noSuchParcel)
        }
    }

    static async rejectParcel(driverId, parcelId, rejectReason, rejectComment, rejectPhotoUrl, res) {
        const trips = await Trip.find()
        const parcel = await Parcel.findOne({_id: parcelId}).populate("sender driver")
        if (parcel) {
            const trip = trips.find(trip => trip.parcels.map(parcelId => parcelId.toString()).includes(parcelId))
            if (driverId.toString() === trip.driver.toString()) {
                parcel.rejectReason = rejectReason
                parcel.rejectComment = rejectComment
                parcel.rejectPhotoUrl = rejectPhotoUrl
                parcel.status = ParcelStatues.REJECTED
                await Parcel.updateOne({_id: parcelId}, parcel)

                trip.parcels = trip.parcels.filter(id => id !== parcelId)
                await Trip.updateOne({_id: trip._id}, trip)

                parcel.sender.fcmTokens = []
                if (parcel.driver) {
                    parcel.driver.fcmTokens = []
                }
                const senderId = parcel.sender._id.toString()
                Socket.emitEvent(senderId, "parcelRejected", parcel)
                await sendPushNotifications(senderId, {key: "PARCEL_REJECTED", parcelId: parcel._id})
                return res.status(200).send(parcel)
            } else {
                return res.status(400).send(Error.notInYouTrip)
            }
        } else {
            return res.status(400).send(Error.noSuchParcel)
        }
    }

    static async deliverParcel(parcelId, secret, res) {
        const parcelSecret = await Secret.findOne({parcelId})
        if (parcelSecret) {
            if (parcelSecret.secret === secret) {
                const parcel = await Parcel.findOneAndUpdate(
                    {_id: parcelId},
                    {status: ParcelStatues.DELIVERED},
                    {new: true}
                )
                    .populate("sender driver")

                parcel.sender.fcmTokens = []
                if (parcel.driver) {
                    parcel.driver.fcmTokens = []
                }
                const senderId = parcel.sender._id.toString()
                Socket.emitEvent(senderId, "parcelDelivered", parcel)
                await sendPushNotifications(senderId, {key: "PARCEL_DELIVERED", parcelId: parcel._id})

                return res.status(200).send(parcel)
            } else {
                return res.status(400).send(Error.accessDenied)
            }
        } else {
            return res.status(400).send(Error.noSecretForThisParcel)
        }
    }

    static async getParcelByIdAndSecret(parcelId, secret, res) {
        const parcelSecret = await Secret.findOne({parcelId})
        if (parcelSecret) {
            if (parcelSecret.secret === secret) {
                const parcel = (await Parcel.findOne({_id: parcelId}).populate("sender driver")).toObject()
                const origin = parcel.startPoint.latitude.toString() + "," + parcel.startPoint.longitude.toString()
                const destination = parcel.endPoint.latitude.toString() + "," + parcel.endPoint.longitude.toString()
                const route = await GoogleService.getOnlyDirection(origin, destination)
                if (route) {
                    parcel.points = JSON.parse(route.response).points
                }
                return res.status(200).send(parcel)
            } else {
                return res.status(400).send(Error.accessDenied)
            }
        } else {
            return res.status(400).send(Error.accessDenied)
        }

    }
}

module.exports = ParcelService