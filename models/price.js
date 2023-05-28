const mongoose = require('mongoose')
const Extensions = require('../utils/extensions')

const priceSchema = new mongoose.Schema({
    value: {
        type: Number,
        unique: false,
        required: true,
    },
    currency: {
        type: String,
        enum: Extensions.getAvailableCurrencies(),
        unique: false,
        required: true,
    }
})

module.exports = priceSchema