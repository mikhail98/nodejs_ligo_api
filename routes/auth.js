const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Error = require('../errors/errors')
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")

const router = express.Router()

router.post('/login', async (req, res) => {
    const {email, password} = req.body
    const user = await User.findOne({email})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }

    if (await bcrypt.compare(password, user.password)) {
        user.token = jwt.sign(
            {email_id: user.email}, "LigoTokenKey", {}
        )
        user.password = ""
        user.fcmTokens = []
        res.status(200).send(user)
    } else {
        res.status(400).send(Error.wrongPassword)
    }
})

router.post('/:id/logout', auth, async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {fcmToken: null})
    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    const {fcmToken} = req.body
    user.fcmTokens = user.fcmTokens.filter(token => token !== fcmToken)
    await User.updateOne({_id: req.params.id}, user)
    res.status(200).send()
})

router.post('/:id/delete', auth, async (req, res) => {
    const user = await User.findByIdAndDelete({_id: req.params.id})
    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    res.status(200).send()
})

module.exports = router
