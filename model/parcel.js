const mongoose = require('mongoose')
const priceSchema = require("./price")
const locationSchema = require("./location")
const ParcelStatues = require("../utils/config").ParcelStatues

const parcelSchema = new mongoose.Schema({
    weight: {type: Number},
    rejectComment: {type: String},
    rejectPhotoUrl: {type: String},
    notifiedDrivers: [{type: String}],
    driversBlacklist: [{type: String}],
    price: {type: priceSchema, required: true},
    parcelPhoto: {type: String, required: true},
    endPoint: {type: locationSchema, required: true},
    startPoint: {type: locationSchema, required: true},
    chatId: {type: mongoose.Schema.Types.ObjectId},
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    driver: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    rejectReason: {type: String, enum: ['PARCEL_TOO_BIG', 'CANT_FIND_SENDER', 'PARCEL_ILLEGAL', 'OTHER']},
    types: [{
        type: String,
        enum: ['SMALL', 'MEDIUM', 'LARGE', 'DOCUMENTS', 'OVERSIZE'],
        required: true
    }],
    status: {
        type: String,
        required: true,
        enum: Object.values(ParcelStatues)
    }
}, {timestamps: true})

const Parcel = mongoose.model('Parcel', parcelSchema)

module.exports = Parcel