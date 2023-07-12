const mongoose = require('mongoose')

const pointSchema = new mongoose.Schema({
    latitude: {type: String, required: true,},
    longitude: {type: String, required: true,},
    cityName: {type: String, required: false,},
    name: {type: String, required: false,},
    address: {type: String, required: false,}
})

module.exports = pointSchema