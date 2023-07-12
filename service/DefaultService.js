const User = require("../model/user")
const Trip = require("../model/trip")
const Parcel = require("../model/parcel")

const Error = require('../utils/errors')
const Config = require("../utils/config")

const Json2csvParser = require("json2csv").Parser

class DefaultService {

    static async isWorking(res) {
        return res.status(200).send({isWorking: true})
    }

    static async getConfig(res) {
        return res.status(200).send({currencies: Config.getAvailableCurrencies()})
    }

    static async getUsersCsv(res) {
        User.find()
            .then(users => {
                let lightUsers = users.map(user => user.toObject())
                lightUsers.forEach(user => {
                    delete user.isActive
                    delete user.fcmTokens
                    delete user.ratings
                    delete user.isAdmin
                    delete user.__v
                    delete user.location
                    delete user.token
                    delete user.avatarUrl
                    delete user.passportPhotoUrl
                })
                const csvFields = ['_id', 'name', 'email', 'isDriver', 'phone', 'isDeleted', 'role']
                const json2csvParser = new Json2csvParser({csvFields})

                res.attachment("users.csv")
                return res.status(200).send(json2csvParser.parse(lightUsers))
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getParcelsCsv(res) {
        Parcel.find()
            .then(parcels => {
                let lightParcels = parcels.map(parcel => parcel.toObject())
                lightParcels.forEach(parcel => {
                    delete parcel.__v
                    delete parcel.updatedAt
                    delete parcel.startPoint.name
                    delete parcel.startPoint.address
                    delete parcel.startPoint._id
                    delete parcel.endPoint.name
                    delete parcel.endPoint.address
                    delete parcel.endPoint._id
                    delete parcel.price._id
                    delete parcel.notifiedDrivers
                    delete parcel.rejectPhotoUrl
                    delete parcel.driversBlacklist
                    parcel.route = `${parcel.startPoint.cityName} -> ${parcel.endPoint.cityName}`
                })
                const csvFields = ['_id', 'userId', 'startPoint', 'endPoint', 'types', 'status', 'price', 'weight', 'createdAt']
                const json2csvParser = new Json2csvParser({csvFields})

                if (lightParcels.length === 0) {
                    return res.status(200).send()
                } else {
                    res.attachment("parcels.csv")
                    return res.status(200).send(json2csvParser.parse(lightParcels))
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }

    static async getTripsCsv(res) {
        Trip.find()
            .then(trips => {
                let lightTrips = trips.map(trip => trip.toObject())
                lightTrips.forEach(trip => {
                    delete trip.__v
                    delete trip.updatedAt
                    delete trip.startPoint.name
                    delete trip.startPoint.address
                    delete trip.startPoint._id
                    delete trip.endPoint.name
                    delete trip.endPoint.address
                    delete trip.endPoint._id
                    trip.route = `${trip.startPoint.cityName} -> ${trip.endPoint.cityName}`
                })
                const csvFields = ['_id', 'driverId', 'startPoint', 'endPoint', 'status', 'parcels', 'createdAt']
                const json2csvParser = new Json2csvParser({csvFields})

                if (lightTrips.length === 0) {
                    return res.status(200).send()
                } else {
                    res.attachment("trips.csv")
                    return res.status(200).send(json2csvParser.parse(lightTrips))
                }
            })
            .catch(error => {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            })
    }
}

module.exports = DefaultService