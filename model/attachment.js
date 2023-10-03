const locationSchema = require('./location')

const mongoose = require('mongoose')

const attachmentSchema = new mongoose.Schema({
        type: {type: String, enum: ['PHOTO', 'VIDEO', 'AUDIO', 'LOCATION']},
        mediaUrl: {type: String},
        location: {type: locationSchema},
    }
)

module.exports = attachmentSchema