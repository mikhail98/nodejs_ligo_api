const router = require('express').Router()

const log = require('../middleware/log')
const auth = require('../middleware/auth')

const ParcelService = require("../service/ParcelService")

router.post('/', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    const {startPoint, endPoint, types, weight, price} = req.body
    return ParcelService.createParcel(req.user, startPoint, endPoint, types, weight, price, res)
})

router.post('/:id/secret', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    return ParcelService.createSecretForParcel(req.user._id, req.params.id, req.body.secret, res)
})

router.get('/:id/secret', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    return ParcelService.getSecretForParcel(req.user._id, req.params.id, res)
})

router.get('/:id', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    return ParcelService.getParcelById(req.params.id, res)
})

router.post('/:id/accept', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    return ParcelService.acceptParcel(req.user._id, req.params.id, res)
})

router.post('/:id/decline', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    return ParcelService.declineParcel(req.user._id, req.params.id, res)
})

router.post('/:id/pickup', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    return ParcelService.pickupParcel(req.user._id, req.body.tripId, req.params.id, res)
})

router.post('/:id/cancel', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    return ParcelService.cancelParcel(req.user._id, req.params.id, res)
})

router.post('/:id/reject', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    const parcelId = req.params.id
    const {tripId, rejectReason, rejectComment, rejectPhotoUrl} = req.body
    return ParcelService.rejectParcel(tripId, parcelId, rejectReason, rejectComment, rejectPhotoUrl, res)
})

router.post('/:id/deliver', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    const parcelId = req.params.id
    const {tripId, secret} = req.body
    return ParcelService.deliverParcel(tripId, parcelId, secret, res)
})

module.exports = router