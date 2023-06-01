const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const Error = require('../errors/errors')
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")
const log = require('../middleware/log')

const router = express.Router()

router.post('/login', log, async (req, res) => {
    const {email, password} = req.body
    const user = await User.findOne({email})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }

    if (await bcrypt.compare(password, user.password)) {
        user.token = jwt.sign(
            {email_id: user.email}, "LigoTokenKey", {}
        )
        user.password = null
        user.fcmTokens = []
        res.status(200).send(user)
    } else {
        res.status(400).send(Error.wrongPassword)
    }
})

router.post('/:id/logout', log, auth, async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {fcmToken: null})
    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    const {fcmToken} = req.body
    user.fcmTokens = user.fcmTokens.filter(token => token !== fcmToken)
    await User.updateOne({_id: req.params.id}, user)
    res.status(200).send()
})

router.post('/:id/delete', log, auth, async (req, res) => {
    const userId = req.params.id
    const user = await User.findByIdAndUpdate(
        {
            _id: userId
        }, {
            name: userId,
            email: userId,
            password: userId,
            phone: null,
            isDriver: false,
            location: null,
            fcmTokens: [],
            isValidated: false,
            passportPhotoUrl: null,
            avatarUrl: null,
            isAdmin: false,
            ratings: [],
            token: null,
            isDeleted: true
        }
    )
    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    res.status(200).send()
})

module.exports = router
