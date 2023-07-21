const router = require('express').Router()

const Error = require("../utils/errors")

const log = require('../middleware/log')
const auth = require("../middleware/auth")

const GoogleService = require('../service/GoogleService')

router.get('/places', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']

    const text = req.query.query
    try {
        return await GoogleService.getPlacesByText(text, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/directions', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']

    const origin = req.query.origin
    const destination = req.query.destination
    try {
        return await GoogleService.getDirection(origin, destination, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/localization', log, async (req, res) => {
    // #swagger.tags = ['Google']

    try {
        return await GoogleService.getLocalization(false, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/parseLocalization', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']

    try {
        return await GoogleService.getLocalization(true, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

module.exports = router