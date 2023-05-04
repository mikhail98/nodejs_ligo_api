const mongoose = require('mongoose')
const pointSchema = require("../models/point")

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
    size: {
        type: String,
        enum: ['XS', 'S', 'M', 'L', 'XL'],
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
    }
})

const Parcel = mongoose.model('Parcel', parcelSchema)

module.exports = {
    Parcel, parcelSchema
}