const mongoose = require('mongoose')

const googlePlaceSchema = new mongoose.Schema({
    text: {
        type: String,
        unique: false,
        required: true,
    },
    response: {
        type: String,
        unique: false,
        required: true,
    }
}, {timestamps: true})

const GooglePlace = mongoose.model('GooglePlace', googlePlaceSchema)

module.exports = GooglePlace