const router = require('express').Router()

const Error = require("../utils/errors")

const log = require('../middleware/log')
const auth = require('../middleware/auth')

const ChatService = require('../service/ChatService')

router.get('/', log, auth, async (req, res) => {
    try {
        return await ChatService.getChats(req.user._id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/sendMessage', log, auth, async (req, res) => {
    const chatId = req.params.id
    const authorId = req.user._id.toString()
    const {message} = req.body
    try {
        return await ChatService.sendMessage(chatId, authorId, message, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/byParcel/:id', log, auth, async (req, res) => {
    try {
        const userId = req.user._id.toString()
        return await ChatService.getChatForParcel(userId, req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/:id/readMessages', log, auth, async (req, res) => {
    try {
        const userId = req.user._id.toString()
        return await ChatService.readMessages(userId, req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

module.exports = router