const router = require('express').Router()

const Error = require("../utils/errors")

const log = require('../middleware/log')
const auth = require('../middleware/auth')
const access = require('../middleware/access')

const UserService = require('../service/UserService')

//create user
router.post('/', log, async (req, res) => {
    // #swagger.tags = ['Users']

    const {name, email, phone, role, fcmToken, googleToken} = req.body

    try {
        return await UserService.createUser(name, email, phone, role, fcmToken, googleToken, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

//get user by id
router.get('/:id', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    try {
        return await UserService.getUserById(req.user, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/exists', log, async (req, res) => {
    // #swagger.tags = ['Users']

    const {email} = req.body
    try {
        return await UserService.getUserExists(email, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

//update user fcm token
router.patch('/:id/fcmToken', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    const {fcmToken} = req.body
    try {
        return await UserService.updateFcmToken(req.user, fcmToken, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

//update user avatar
router.patch('/:id/avatarPhoto', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    const {avatarPhoto} = req.body
    try {
        return await UserService.updateAvatarPhoto(req.user._id, avatarPhoto, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

//feedback user
router.patch('/:id/rating/:rating', log, auth, async (req, res) => {
    // #swagger.tags = ['Users']

    const userFrom = req.user._id
    const userTo = req.params.id
    const rating = req.params.rating
    try {
        return await UserService.updateUserRating(userFrom, userTo, rating, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

//update user location
router.patch('/:id/location', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    const {location} = req.body
    try {
        return await UserService.updateDriverLocation(req.user._id, location, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/:id/driverTrips', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    try {
        return await UserService.getDriverTrips(req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/:id/senderParcels', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    try {
        return await UserService.getSenderParcels(req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

module.exports = router
