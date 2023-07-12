const router = require('express').Router()

const log = require('../middleware/log')
const auth = require("../middleware/auth")
const access = require('../middleware/access')

const AuthService = require('../service/AuthService')

router.post('/login', log, async (req, res) => {
    // #swagger.tags = ['Auth']

    const {email, googleToken} = req.body
    return await AuthService.login(email, googleToken, res)
})

router.post('/:id/logout', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Auth']

    const {fcmToken} = req.body
    return await AuthService.logout(req.user, fcmToken, res)
})

router.post('/:id/delete', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Auth']

    return await AuthService.deleteUser(req.user, res)
})

module.exports = router
