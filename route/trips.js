const router = require('express').Router()

const log = require('../middleware/log')
const auth = require('../middleware/auth')

const TripService = require("../service/TripService")

//create trip
router.post('/', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    const {startPoint, endPoint, date} = req.body
    return await TripService.createTrip(req.user, startPoint, endPoint, date, res)
})

router.get('/:id', log,auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    return await TripService.getTripById(req.params.id, res)
})

router.post('/:id/complete', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    return await TripService.completeTrip(req.params.id, res)
})

router.post('/:id/cancel', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    return await TripService.cancelTrip(req.params.id, res)
})

router.post('/:id/start', log, auth, async (req, res) => {
    // #swagger.tags = ['Trips']

    return await TripService.startTrip(req.params.id, res)
})

module.exports = router