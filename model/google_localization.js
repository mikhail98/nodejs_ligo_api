const mongoose = require('mongoose')

const keySchema = new mongoose.Schema({
    key: {type: String, required: true,},
    value: {type: String, required: true,}
})

const googleLocalizationSchema = new mongoose.Schema({
    locale: {type: String, required: true,},
    keys: [{type: keySchema, required: true,}]
})

const localizationSchema = new mongoose.Schema({
    localization: [{type: googleLocalizationSchema, required: true,}]
}, {timestamps: true})

const GoogleLocalization = mongoose.model('GoogleLocalization', localizationSchema)

module.exports = GoogleLocalization