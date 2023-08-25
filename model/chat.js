const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    driver: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    sender: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    messages: [{type: mongoose.Schema.Types.ObjectId, ref: 'Message'}]
}, {timestamps: true})

const Chat = mongoose.model('Chat', chatSchema)

module.exports = Chat