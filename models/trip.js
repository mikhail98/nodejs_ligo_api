const mongoose = require('mongoose');
const pointSchema = require('../models/point').pointSchema;

const tripSchema = new mongoose.Schema({
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
    driver: {
        type: String,
        unique: false,
        required: true,
    },
}, {timestamps: true});

const Trip = mongoose.model('Trip', tripSchema);

module.exports = Trip