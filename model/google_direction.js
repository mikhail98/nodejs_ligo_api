const mongoose = require('mongoose')

const googleDirectionSchema = new mongoose.Schema({
    origin: {type: String, required: true,},
    destination: {type: String, required: true,},
    response: {type: String, required: false,},
    startAddress: {type: String, required: false,},
    endAddress: {type: String, required: false,}
}, {timestamps: true})

const GoogleDirection = mongoose.model('GoogleDirection', googleDirectionSchema)

module.exports = GoogleDirection