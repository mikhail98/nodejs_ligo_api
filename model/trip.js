const mongoose = require('mongoose')
const pointSchema = require('./point')

const tripSchema = new mongoose.Schema({
    driver: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    startPoint: {type: pointSchema, required: true},
    endPoint: {type: pointSchema, required: true},
    parcels: [{type: mongoose.Schema.Types.ObjectId, ref: 'Parcel'}],
    status: {
        type: String,
        enum: ['SCHEDULED', 'ACTIVE', 'FINISHED'],
        required: true
    }
}, {timestamps: true})

const Trip = mongoose.model('Trip', tripSchema)

module.exports = Trip