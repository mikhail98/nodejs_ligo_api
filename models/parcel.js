const mongoose = require('mongoose')
const pointSchema = require("../models/point")
const priceSchema = require("../models/price")

const parcelSchema = new mongoose.Schema({
    userId: {
        type: String,
        unique: false,
        required: true,
    },
    startPoint: {
        type: pointSchema,
        unique: false,
        required: true,
    },
    endPoint: {
        type: pointSchema,
        unique: false,
        required: true,
    },
    types: {
        type: String,
        enum: ['SMALL_BOX', 'BOX', 'BIG_BOX', 'DOCUMENTS', 'LARGE_ITEM'],
        unique: false,
        required: true
    },
    notifiedDrivers: [{
        type: String,
        unique: false,
        required: false
    }],
    driversBlacklist: [{
        type: String,
        unique: false,
        required: false
    }],
    status: {
        type: String,
        enum: ['CREATED', 'ACCEPTED', 'PICKED', 'DELIVERED', 'CANCELLED'],
        unique: false,
        required: true
    },
    givingPeriods: [{
        type: String,
        enum: ['MORNING', 'DAY', 'EVENING', 'NIGHT'],
        unique: false,
        required: true
    }],
    price: {
        type: priceSchema,
        unique: false,
        required: true,
    }
}, {timestamps: true})

const Parcel = mongoose.model('Parcel', parcelSchema)

module.exports = Parcel