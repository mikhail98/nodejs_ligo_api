const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Error = require('../errors/errors')
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")

const router = express.Router()

router.post('/login', async (req, res) => {
    const {email, password, fcmToken} = req.body
    const user = await User.findOneAndUpdate({email}, {fcmToken})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }

    if (await bcrypt.compare(password, user.password)) {
        user.token = jwt.sign(
            {email_id: user.email}, "LigoTokenKey", {}
        )
        user.password = null
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
    res.status(200).send()
})

module.exports = router
