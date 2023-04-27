const mongoose = require('mongoose')

const ratingSchema = new mongoose.Schema({
    userFrom: {
        type: String,
        unique: false,
        required: true,
    },
    rating: {
        type: Number,
        unique: false,
        required: true,
        min: 1, max: 5
    },
})

module.exports = ratingSchema