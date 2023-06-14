const mongoose = require('mongoose')

const deletedUserSchema = new mongoose.Schema({
        userId: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
        }
    }, {timestamps: true}
)
const DeletedUSer = mongoose.model('DeletedUser', deletedUserSchema)

module.exports = DeletedUSer