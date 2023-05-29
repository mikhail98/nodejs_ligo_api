const mongoose = require('mongoose')

const keySchema = new mongoose.Schema({
    key: {
        type: String,
        unique: false,
        required: true,
    },
    value: {
        type: String,
        unique: false,
        required: true,
    }
})

const googleLocalizationSchema = new mongoose.Schema({
    locale: {
        type: String,
        unique: false,
        required: true,
    },
    keys: [{
        type: keySchema,
        unique: false,
        required: true,
    }]
})

const localizationSchema = new mongoose.Schema({
    localization: [{
        type: googleLocalizationSchema,
        unique: false,
        required: true,
    }]
}, {timestamps: true})

const GoogleLocalization = mongoose.model('GoogleLocalization', localizationSchema)

module.exports = GoogleLocalization