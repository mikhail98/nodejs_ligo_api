const mongoose = require('mongoose')

const pointSchema = new mongoose.Schema({
    latitude: {
        type: String,
        unique: false,
        required: true,
    },
    longitude: {
        type: String,
        unique: false,
        required: true,
    },
    cityName: {
        type: String,
        unique: false,
        required: false,
    },
    address: {
        type: String,
        unique: false,
        required: false,
    }
})

module.exports = pointSchema