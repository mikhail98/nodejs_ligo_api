const express = require('express')
const bcrypt = require('bcrypt')
const User = require('../models/user')
const DeletedUser = require('../models/deleted_user')
const Error = require('../errors/errors')
const jwt = require("jsonwebtoken")
const auth = require("../middleware/auth")
const log = require('../middleware/log')
const {OAuth2Client} = require('google-auth-library')
const Properties = require('../local/properties')

const GOOGLE_AUTH_CLIENT_ID = process.env.GOOGLE_AUTH_CLIENT_ID || Properties.GOOGLE_AUTH_CLIENT_ID
const client = new OAuth2Client(GOOGLE_AUTH_CLIENT_ID)

async function verify(user, token) {
    try {
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: GOOGLE_AUTH_CLIENT_ID
        });
        const payload = ticket.getPayload();
        const email = payload['email'];
        console.log(email)
        return email === user.email
    } catch (error) {
        console.log(error)
        return false
    }
}

const router = express.Router()

router.post('/login', log, async (req, res) => {
    // #swagger.tags = ['Auth']

    const {email, password, token} = req.body
    const user = await User.findOne({email})

    if (!user) {
        return res.status(400).send(Error.noSuchUser)
    }
    if (token !== null) {
        const isValidToken = await verify(user, token)
        if (!isValidToken) {
            return res.status(400).send(Error.wrongPassword)
        }
    } else if (password !== null) {
        const isValidPassword = await bcrypt.compare(password, user.password)
        if (!isValidPassword) {
            return res.status(400).send(Error.wrongPassword)
        }
    } else {
        return res.status(400).send(Error.provideTokenOrPassword)
    }

    user.token = jwt.sign(
        {email_id: user.email}, "LigoTokenKey", {}
    )
    user.password = null
    user.fcmTokens = []
    res.status(200).send(user)
})

router.post('/:id/logout', log, auth, async (req, res) => {
    // #swagger.tags = ['Auth']
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
    // #swagger.tags = ['Auth']
    const userId = req.params.id
    const userToDelete = await User.findById(userId)
    if (!userToDelete) {
        return res.status(400).send(Error.noSuchUser)
    }
    const email = userToDelete.email
    await User.findByIdAndUpdate(
        {
            _id: userId
        }, {
            name: userId,
            email: userId,
            password: userId,
            phone: null,
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
    await DeletedUser.create({userId, email})
    res.status(200).send()
})

module.exports = router
