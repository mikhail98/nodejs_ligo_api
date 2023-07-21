const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema({
    userFrom: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    userTo: {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
    rating: {type: Number, required: true, min: 1, max: 5},
})

const Rating = mongoose.model('Rating', ratingSchema)

module.exports = {
    ratingSchema, Rating
}