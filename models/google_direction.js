const mongoose = require('mongoose')

const googleDirectionSchema = new mongoose.Schema({
    origin: {
        type: String,
        unique: false,
        required: true,
    },
    destination: {
        type: String,
        unique: false,
        required: true,
    },
    response: {
        type: String,
        unique: false,
        required: true,
    },
    startAddress: {
        type: String,
        unique: false,
        required: false,
    },
    endAddress: {
        type: String,
        unique: false,
        required: false,
    }
})

const GoogleDirection = mongoose.model('GoogleDirection', googleDirectionSchema)

module.exports = GoogleDirection