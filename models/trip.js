const mongoose = require('mongoose')
const pointSchema = require('../models/point')

const tripSchema = new mongoose.Schema({
    driverId: {
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
    status: {
        type: String,
        enum: ['SCHEDULED', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
        required: true
    },
    parcels: [{
        type: String,
        required: false,
    }]
}, {timestamps: true})

const Trip = mongoose.model('Trip', tripSchema)

module.exports = Trip