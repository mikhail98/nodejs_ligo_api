const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    driver: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    parcel: {type: mongoose.Schema.Types.ObjectId, ref: 'Parcel'},
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}]
}, {timestamps: true})

const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat