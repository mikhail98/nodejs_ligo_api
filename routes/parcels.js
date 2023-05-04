const express = require('express')

const {Parcel} = require('../models/parcel')
const User = require('../models/user')
const auth = require('../middleware/auth')
const Errors = require("../errors/errors");

const router = express.Router()

router.post('/', auth, async (req, res) => {
    try {
        const {userId, startPoint, endPoint, size} = req.body

        const user = await User.findOne({_id: userId})

        if (user === null) {
            return res.status(400).send(Errors.noSuchUser)
        }

        const createdParcel = await Parcel.create({
            userId: userId,
            startPoint: startPoint,
            endPoint: endPoint,
            size: size,
            status: 'CREATED'
        })

        const responseParcel = createdParcel.toObject()
        user.password = null
        responseParcel.user = user
        res.status(200).send(responseParcel)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/:id', auth, async (req, res) => {
    const parcel = await Parcel.findOne({_id: req.params.id})

    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }

    const user = await User.findOne({_id: parcel.userId})
    if (user === null) {
        return res.status(400).send(Errors.noSuchUser)
    }

    const responseParcel = parcel.toObject()
    user.password = null
    responseParcel.user = user
    res.status(200).send(responseParcel)
})

module.exports = router