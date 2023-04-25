const mongoose = require('mongoose')
const pointSchema = require('../models/point').pointSchema

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: false,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        unique: false,
        required: true,
    },
    isDriver: {
        type: Boolean,
        unique: false,
        required: true,
    },
    isActive: {
        type: Boolean,
        unique: false,
        required: true,
    },
    location: {
        type: pointSchema,
        unique: false,
        required: false,
    },
    fcmToken: {
        type: String,
        unique: false,
        required: false,
    },
    isValidated: {
        type: Boolean,
        unique: false,
        required: false,
    },
    passportPhotoUrl: {
        type: String,
        unique: false,
        required: false,
    },
    isAdmin: {
        type: Boolean,
        unique: false,
        required: true,
    },
    token: {
        type: String,
        unique: false,
        required: false,
    },
})

const User = mongoose.model('User', userSchema)

module.exports = User