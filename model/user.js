const mongoose = require('mongoose')
const pointSchema = require('./point')
const ratingSchema = require('./rating').ratingSchema

const userSchema = new mongoose.Schema({
    token: {type: String},
    isDeleted: {type: Boolean},
    fcmTokens: [{type: String}],
    avatarPhoto: {type: String},
    passportPhoto: {type: String},
    location: {type: pointSchema},
    ratings: [{type: ratingSchema}],
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