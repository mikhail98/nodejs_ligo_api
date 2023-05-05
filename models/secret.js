const mongoose = require('mongoose')

const secretSchema = new mongoose.Schema({
        userId: {
            type: String,
            required: true,
        },
        parcelId: {
            type: String,
            required: true,
        },
        secret: {
            type: String,
            required: true,
        }
    }, {timestamps: true}
)
const Secret = mongoose.model('Secret', secretSchema)

module.exports = Secret