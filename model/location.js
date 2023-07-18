const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema({
    latitude: {type: Number, required: true,},
    longitude: {type: Number, required: true,},
    cityName: {type: String, required: false,},
    address: {type: String, required: false,},
    name: {type: String, required: false,}
})

module.exports = locationSchema