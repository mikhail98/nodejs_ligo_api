const attachmentSchema = require('./attachment')

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        chat: {type: mongoose.Schema.Types.ObjectId, ref: 'Chat'},
        text: {type: String},
        attachment: {type: attachmentSchema},
        isDeleted: {
            type: Boolean,
            default: false
        },
        isEdited: {
            type: Boolean,
            default: false
        },
        isRead: {
            type: Boolean,
            default: false
        }
    }, {timestamps: true}
)
const Message = mongoose.model('Message', messageSchema)

module.exports = Message