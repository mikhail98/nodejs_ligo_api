const mongoose = require('mongoose');
const pointSchema = require('../models/point').pointSchema;

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
        required: false,
    },
    isActive: {
        type: Boolean,
        unique: false,
        required: false,
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
});

const User = mongoose.model('User', userSchema);

module.exports = User;