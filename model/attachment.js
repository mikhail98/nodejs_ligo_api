const locationSchema = require('./location')

const mongoose = require('mongoose')

const attachmentSchema = new mongoose.Schema({
        type: {type: String, enum: ['PHOTO', 'VIDEO', 'AUDIO', 'LOCATION']},
        photoUrl: {type: String},
        videoUrl: {type: String},
        audioUrl: {type: String},
        location: {type: locationSchema},
    }, {timestamps: true}
)

module.exports = attachmentSchema