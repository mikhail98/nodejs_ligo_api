const mongoose = require('mongoose')
const Config = require("../utils/config")

const priceSchema = new mongoose.Schema({
    value: {type: Number, required: true,},
    currency: {type: String, enum: Config.getAvailableCurrencies(), required: true,}
})

module.exports = priceSchema