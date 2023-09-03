const Chat = require("../model/chat")
const Message = require("../model/message")

const Error = require("../utils/errors")
const Socket = require("../utils/socket")

const sendPushNotifications = require("../utils/fcm")

class ChatService {

    static async createChat(parcelId, driverId, senderId) {
        await Chat.create({
            driver: driverId,
            sender: senderId,
            parcel: parcelId,
            messages: []
        })
    }

    static async getChatForParcel(userId, parcelId, res) {
        const chat = await Chat.findOne({parcel: parcelId}).populate("parcel driver sender messages")
        const driverId = chat.driver._id.toString()
        const senderId = chat.sender._id.toString()
        if (userId !== driverId && userId !== senderId) {
            return res.status(400).send(Error.userNotInThisChat)
        } else {
            return res.status(200).send(chat)
        }
    }

    static async getChats(userId, res) {
        const chats = await Chat.find({
            $or: [
                {driver: userId},
                {sender: userId}
            ]
        }).populate("parcel driver sender messages")
        return res.status(200).send(chats)
    }

    static async sendMessage(chatId, authorId, message, res) {
        message.user = authorId
        message.chat = chatId
        const createdMessage = await Message.create(message)
        const chat = await Chat.findOne({_id: chatId})

        const driverId = chat.driver.toString()
        const senderId = chat.sender.toString()

        console.log(driverId)

        if (authorId !== driverId && authorId !== senderId) {
            return res.status(400).send(Error.userNotInThisChat)
        } else {
            chat.messages.push(createdMessage._id)
            await Chat.updateOne({_id: chatId}, chat)

            const pushData = {key: 'NEW_MESSAGE', message: createdMessage}
            if (authorId === driverId) {
                await sendPushNotifications(senderId, pushData)
                Socket.emitEvent(senderId, 'newMessage', createdMessage)
            }
            if (authorId === senderId) {
                await sendPushNotifications(driverId, pushData)
                Socket.emitEvent(driverId, 'newMessage', createdMessage)
            }

            return res.status(200).send()
        }
    }
}

module.exports = ChatService