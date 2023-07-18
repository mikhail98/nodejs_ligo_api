const mongoose = require('mongoose')
const locationSchema = require('./location')

const tripSchema = new mongoose.Schema({
    driver: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    startPoint: {type: locationSchema, required: true},
    endPoint: {type: locationSchema, required: true},
    parcels: [{type: mongoose.Schema.Types.ObjectId, ref: 'Parcel'}],
    status: {
        type: String,
        enum: ['SCHEDULED', 'ACTIVE', 'FINISHED'],
        required: true
    }
}, {timestamps: true})

const Trip = mongoose.model('Trip', tripSchema)

module.exports = Trip