const router = require('express').Router()

const Error = require("../utils/errors")

const log = require('../middleware/log')
const auth = require('../middleware/auth')

const ChatService = require("../service/ChatService")
const ParcelService = require("../service/ParcelService")

router.post('/', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    const {startPoint, endPoint, types, weight, price, secret} = req.body
    try {
        return await ParcelService.createParcel(req.user, startPoint, endPoint, types, weight, price, secret, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/:id/secret', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    try {
        return await ParcelService.getSecretForParcel(req.user._id, req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/:id', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    try {
        return await ParcelService.getParcelById(req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/accept', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    try {
        return await ParcelService.acceptParcel(req.user._id, req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/decline', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    try {
        return await ParcelService.declineParcel(req.user._id, req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/pickup', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    try {
        return await ParcelService.pickupParcel(req.user._id, req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/cancel', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    try {
        return await ParcelService.cancelParcel(req.user._id, req.params.id, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/reject', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    const parcelId = req.params.id
    const {tripId, rejectReason, rejectComment, rejectPhotoUrl} = req.body
    try {
        return await ParcelService.rejectParcel(req.user._id, parcelId, rejectReason, rejectComment, rejectPhotoUrl, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/deliver', log, auth, async (req, res) => {
    // #swagger.tags = ['Parcels']

    const parcelId = req.params.id
    const {secret} = req.body
    try {
        return await ParcelService.deliverParcel(parcelId, secret, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.post('/:id/withSecret', log, async (req, res) => {
    const parcelId = req.params.id
    const {secret} = req.body
    try {
        return await ParcelService.getParcelByIdAndSecret(parcelId, secret, res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

module.exports = router