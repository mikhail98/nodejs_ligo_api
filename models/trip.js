const mongoose = require('mongoose')
const pointSchema = require('../models/point')
const parcelSchema = require('../models/parcel').parcelSchema

const tripSchema = new mongoose.Schema({
    driver: {
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
    driverLocation: {
        type: pointSchema,
        unique: false,
        required: true,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        unique: false,
        required: true
    },
    parcels: [{
        type: parcelSchema,
        unique: false,
        required: false,
    }]
}, {timestamps: true})

const Trip = mongoose.model('Trip', tripSchema)

module.exports = Trip