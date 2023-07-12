const mongoose = require('mongoose')

const googlePlaceSchema = new mongoose.Schema({
    text: {type: String, required: true,},
    response: {type: String, required: true,}
}, {timestamps: true})

const GooglePlace = mongoose.model('GooglePlace', googlePlaceSchema)

module.exports = GooglePlace