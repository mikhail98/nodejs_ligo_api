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
    types: [{
        type: String,
        enum: ['SMALL', 'MEDIUM', 'LARGE', 'DOCUMENTS', 'OVERSIZE'],
        unique: false,
        required: true
    }],
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
    price: {
        type: priceSchema,
        unique: false,
        required: true,
    },
    weight: {
        type: Number,
        unique: false,
        required: false,
    }
}, {timestamps: true})

const Parcel = mongoose.model('Parcel', parcelSchema)

module.exports = Parcel