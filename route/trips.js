const router = require('express').Router()

const Error = require("../utils/errors")

const log = require('../middleware/log')
const auth = require('../middleware/auth')

const TripService = require("../service/TripService")

//create trip
router.post('/', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    const {startPoint, endPoint, date} = req.body
    try {
        return await TripService.createTrip(req.user, startPoint, endPoint, date, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/:id', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    try {
        return await TripService.getTripById(req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/complete', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    try {
        return await TripService.completeTrip(req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/cancel', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    try {
        return await TripService.cancelTrip(req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/start', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    try {
        return await TripService.startTrip(req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

module.exports = router