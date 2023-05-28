const mongoose = require('mongoose')
const Config = require("../utils/config")

const priceSchema = new mongoose.Schema({
    value: {
        type: Number,
        unique: false,
        required: true,
    },
    currency: {
        type: String,
        enum: Config.getAvailableCurrencies(),
        unique: false,
        required: true,
    }
})

module.exports = priceSchema