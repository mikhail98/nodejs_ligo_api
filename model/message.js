const attachmentSchema = require('./attachment')

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
        user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
        text: {type: String},
        attachment: {type: attachmentSchema},
        isDeleted: {type: Boolean},
        isEdited: {type: Boolean},
        isRead: {type: Boolean}
    }, {timestamps: true}
)
const Message = mongoose.model('Message', messageSchema)

module.exports = Message