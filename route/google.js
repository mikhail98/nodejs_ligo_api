const router = require('express').Router()

const log = require('../middleware/log')
const auth = require("../middleware/auth")

const GoogleService = require('../service/GoogleService')

router.get('/places', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']

    const text = req.query.query
    return GoogleService.getPlacesByText(text, res)
})

router.get('/directions', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']

    const origin = req.query.origin
    const destination = req.query.destination
    return GoogleService.getDirection(origin, destination, res)
})

router.get('/localization', log, async (req, res) => {
    // #swagger.tags = ['Google']

    return GoogleService.getLocalization(false, res)
})

router.get('/parseLocalization', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']

    return GoogleService.getLocalization(true, res)
})

module.exports = router