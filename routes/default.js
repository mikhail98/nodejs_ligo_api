const express = require('express')
const log = require('../middleware/log')
const Config = require("../utils/config")
const User = require("../models/user");
const Trip = require("../models/trip");
const Parcel = require("../models/parcel");
const Json2csvParser = require("json2csv").Parser;

const router = express.Router()

router.get('/', log, async (req, res) => {
    // #swagger.tags = ['Default']
    res.status(200).send({isWorking: true})
})

router.get('/config', log, async (req, res) => {
    // #swagger.tags = ['Default']
    res.status(200).send({currencies: Config.getAvailableCurrencies()})
})

if (process.env.DEBUG) {
    router.get('/users228', async (req, res) => {
        const users = (await User.find()).map(user => user.toObject())
        users.forEach(user => {
            delete user.password
            delete user.isValidated
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
        const csvData = json2csvParser.parse(users)

        res.attachment("users.csv")
        res.status(200).send(csvData)
    })

    router.get('/trips228', async (req, res) => {
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
        const csvData = json2csvParser.parse(trips)

        res.attachment("trips.csv")
        res.status(200).send(csvData)
    })

    router.get('/parcels228', async (req, res) => {
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
        const csvData = json2csvParser.parse(parcels)

        res.attachment("parcels.csv")
        res.status(200).send(csvData)
    })
}

module.exports = router