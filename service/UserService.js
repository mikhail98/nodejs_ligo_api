const User = require("../model/user")
const Trip = require("../model/trip")
const Parcel = require("../model/parcel")
const Rating = require("../model/rating").Rating

const Error = require("../utils/errors")
const Socket = require("../utils/socket")

const createJWT = require("../utils/createJWT")
const sendMessageToTelegramBot = require("../utils/telegram")
const verifyGoogleToken = require("../utils/googleTokenVerifier")

class UserService {

    static async createUser(name, email, phone, role, fcmToken, googleToken, res) {
        const oldUser = await User.findOne({email})

        if (oldUser) {
            return res.status(400).send(Error.userExits)
        }

        const isValidToken = await verifyGoogleToken(email, googleToken)
        if (!isValidToken) {
            return res.status(400).send(Error.invalidGoogleToken)
        }

        let fcmTokens
        if (fcmToken) {
            fcmTokens = [fcmToken]
        } else {
            fcmTokens = []
        }

        const user = await User.create({
            name: name,
            role: role,
            phone: phone,
            fcmTokens: fcmTokens,
            email: email.toLowerCase()
        })
        user.token = createJWT(user._id)
        user.fcmTokens = []
        const text = `New user!!! 🙋🙋🙋%0A%0AName: ${user.name}%0AEmail: ${user.email}%0APhone: ${user.phone}%0ARole: ${user.role}%0A%0A%23new_user`
        await sendMessageToTelegramBot(text)
        return res.status(200).send(user)
    }

    static async getUserById(user, res) {
        user.fcmTokens = []
        return res.status(200).send(user)
    }

    static async getUserExists(email, res) {
        const user = await User.findOne({email})
        return res.status(200).send({userExists: user !== null})
    }

    static async updateFcmToken(user, fcmToken, res) {
        user.fcmTokens.push(fcmToken)
        await User.updateOne({_id: user._id}, user)
        return res.status(200).send()
    }

    static async updateAvatarPhoto(userId, newAvatarPhoto, res) {
        await User.findOneAndUpdate({_id: userId}, {avatarPhoto: newAvatarPhoto})
        return res.status(200).send()
    }

    static async updateUserRating(userFromId, userToId, rating, res) {
        const userTo = await User.findOne({_id: userToId})

        const ratingExists = userTo.ratings.filter(rating => {
            return rating.userFrom === userFromId && rating.userTo.toString() === userToId
        }).length !== 0

        if (ratingExists) {
            return res.status(400).send(Error.ratingExists)
        }
        userTo.ratings.push(Rating({userFrom: userFromId, userTo: userToId, rating: rating}))
        await User.updateOne({_id: userToId}, userTo)
        return res.status(200).send()
    }

    static async getDriverTrips(driver, res) {
        const trips = await Trip.find({driver})
            .populate("driver")
            .populate({path: 'parcels', populate: {path: 'sender driver'}})

        trips.forEach(trip => {
            trip.driver.fcmTokens = []
            trip.parcels.forEach(parcel => {
                parcel.sender.fcmTokens = []
                if (parcel.driver) {
                    parcel.driver.fcmTokens = []
                }
            })
        })
        return res.status(200).send(trips)
    }

    static async getSenderParcels(sender, res) {
        const parcels = await Parcel.find({sender}).populate("sender driver")
        parcels.forEach(parcel => {
            parcel.sender.fcmTokens = []
            if (parcel.driver) {
                parcel.driver.fcmTokens = []
            }
        })
        return res.status(200).send(parcels)
    }

    static async updateDriverLocation(driverId, location, res) {
        const user = await User.findOneAndUpdate({_id: driverId}, {location: location})

        if (user) {
            const trip = await Trip.findOne({
                driver: driverId, status: {$in: ['ACTIVE', 'SCHEDULED']}
            }).populate("parcels")
            if (trip) {
                trip.parcels
                    .filter(parcel => parcel.status === 'ACCEPTED' || parcel.status === 'PICKED')
                    .map(parcel => parcel.sender.toString())
                    .forEach(userId => Socket.emitEvent(userId, "driverLocationUpdated", location))
            }
            return res.status(200).send()
        } else {
            return res.status(400).send(Error.noSuchUser)
        }
    }
}

module.exports = UserService