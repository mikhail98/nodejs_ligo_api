const mongoose = require('mongoose')
const locationSchema = require('./location')
const ratingSchema = require('./rating').ratingSchema

const userSchema = new mongoose.Schema({
    token: {type: String},
    isDeleted: {type: Boolean},
    fcmTokens: [{type: String}],
    avatarPhoto: {type: String},
    ratings: [{type: ratingSchema}],
    location: {type: locationSchema},
    name: {type: String, required: true},
    phone: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    role: {
        type: String,
        enum: ['SENDER', 'DRIVER'],
        required: true
    }
})

const User = mongoose.model('User', userSchema)

module.exports = User