const User = require("../model/user")
const Trip = require("../model/trip")
const Parcel = require("../model/parcel")

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
        const users = (await User.find()).map(user => user.toObject())
        users.forEach(user => {
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
        return res.status(200).send(json2csvParser.parse(users))
    }

    static async getParcelsCsv(res) {
        const parcels = (await Parcel.find()).map(parcel => parcel.toObject())
        parcels.forEach(parcel => {
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

        if (parcels.length === 0) {
            return res.status(200).send()
        } else {
            res.attachment("parcels.csv")
            return res.status(200).send(json2csvParser.parse(parcels))
        }
    }

    static async getTripsCsv(res) {
        const trips = (await Trip.find()).map(trip => trip.toObject())
        trips.forEach(trip => {
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

        if (trips.length === 0) {
            return res.status(200).send()
        } else {
            res.attachment("trips.csv")
            return res.status(200).send(json2csvParser.parse(trips))
        }
    }
}

module.exports = DefaultService