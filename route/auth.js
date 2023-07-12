const router = require('express').Router()

const Error = require("../utils/errors")

const log = require('../middleware/log')
const auth = require("../middleware/auth")
const access = require('../middleware/access')

const AuthService = require('../service/AuthService')

router.post('/login', log, async (req, res) => {
    // #swagger.tags = ['Auth']

    const {email, googleToken} = req.body
    try {
        return await AuthService.login(email, googleToken, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/logout', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Auth']

    const {fcmToken} = req.body
    try {
        return await AuthService.logout(req.user, fcmToken, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/delete', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Auth']
    try {
        return await AuthService.deleteUser(req.user, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

module.exports = router
