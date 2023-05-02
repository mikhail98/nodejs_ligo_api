const mongoose = require('mongoose')
const pointSchema = require('../models/point')
const parcelSchema = require('../models/parcel').parcelSchema

const tripSchema = new mongoose.Schema({
    driver: {
        type: String,
        required: true,
    },
    startPoint: {
        type: pointSchema,
        required: true,
    },
    endPoint: {
        type: pointSchema,
        required: true,
    },
    driverLocation: {
        type: pointSchema,
        required: true,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'COMPLETED', 'CANCELLED'],
        required: true
    },
    parcels: [{
        type: parcelSchema,
        required: false,
    }]
}, {timestamps: true})

const Trip = mongoose.model('Trip', tripSchema)

module.exports = Trip