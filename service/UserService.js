const User = require("../model/user")
const Trip = require("../model/trip")
const Parcel = require("../model/parcel")
const Rating = require("../model/rating").Rating

const Error = require("../utils/errors")
const Socket = require("../utils/socket")
const Extensions = require("../utils/extensions")
const ParcelStatues = require("../utils/config").ParcelStatues

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

        return User.create({
            name: name,
            role: role,
            phone: phone,
            fcmTokens: fcmTokens,
            email: email.toLowerCase()
        })
            .then(user => {
                user.token = createJWT(user._id)
                user.fcmTokens = []
                const text = `New user!!! 🙋🙋🙋%0A%0AName: ${user.name}%0AEmail: ${user.email}%0APhone: ${user.phone}%0ARole: ${user.role}%0A%0A%23new_user`
                sendMessageToTelegramBot(text)
                return res.status(200).send(user)
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getUserById(user, res) {
        user.fcmTokens = []
        return res.status(200).send(user)
    }

    static async getUserExists(email, res) {
        return User.findOne({email})
            .then(user => {
                return res.status(200).send({userExists: user !== null})
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async updateFcmToken(user, fcmToken, res) {
        user.fcmTokens.push(fcmToken)
        return User.updateOne({_id: user._id}, user)
            .then(() => {
                return res.status(200).send()
            })
            .catch(error => {
                console.log(error)
                return res.status(200).send()
            })
    }

    static async updateAvatarPhoto(user, newAvatarPhoto, res) {
        user.avatarPhoto = newAvatarPhoto
        return User.updateOne({_id: user._id}, user)
            .then(() => {
                return res.status(200).send()
            })
            .catch(error => {
                console.log(error)
                return res.status(200).send()
            })
    }

    static async updatePassportPhoto(user, newPassportPhoto, res) {
        user.passportPhoto = newPassportPhoto
        return User.updateOne({_id: user._id}, user)
            .then(() => {
                return res.status(200).send()
            })
            .catch(error => {
                console.log(error)
                return res.status(200).send()
            })
    }

    static async updateUserRating(userFrom, userTo, rating, res) {
        return User.findOne({_id: userTo})
            .then(function (userTo) {
                const ratingExists = userTo.ratings.filter(rating => {
                    return rating.userFrom === userFrom && rating.userTo.toString() === userTo
                }).length !== 0

                if (ratingExists) {
                    return res.status(400).send(Error.ratingExists)
                }
                userTo.ratings.push(Rating({userFrom, userTo, rating}))
                return User.updateOne({_id: userFrom}, userTo)
                    .then(() => {
                        return res.status(200).send()
                    })
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getDriverTrips(driver, res) {
        return Trip.find({'driver._id': driver})
            .populate("driver parcels")
            .then(trips => {
                trips.forEach(trip => {
                    trip.driver.fcmTokens = []
                })
                res.status(200).send(trips)
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getSenderParcels(sender, res) {
        return Parcel.find({'sender._id': sender})
            .populate("sender driver")
            .then(parcels => {
                parcels.forEach(parcel => {
                    parcel.sender.fcmTokens = []
                    if (parcel.driver) {
                        parcel.driver.fcmTokens = []
                    }
                })
                res.status(200).send(parcels)
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async updateDriverLocation(driverId, location, res) {
        await User.findOneAndUpdate({_id}, {location: location})
            .then(function (user) {
                if (user) {
                    return Trip.findOne({driver: driverId, status: {$in: ['ACTIVE', 'SCHEDULED']}})
                        .populate("parcels")
                        .then(function (trip) {
                            trip.parcels
                                .filter(parcel => parcel.status === 'ACCEPTED' || parcel.status === 'PICKED')
                                .map(parcel => parcel.sender.toString())
                                .forEach(userId => Socket.emitEvent(userId, "driverLocationUpdated", location))

                            Parcel.find({status: ParcelStatues.CREATED})
                                .then(function (parcels) {
                                    const parcelIds = parcels.map(parcel => parcel._id.toString())
                                    return Promise.allSettled(parcelIds.map(parcelId => Extensions.requestDriverForParcel(parcelId)))
                                        .then(() => {
                                            res.status(200).send()
                                        })
                                })
                        })
                } else {
                    return res.status(400).send(Error.noSuchUser)
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }
}

module.exports = UserService