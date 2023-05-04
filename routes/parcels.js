const express = require('express')

const {Parcel} = require('../models/parcel')
const User = require('../models/user')
const auth = require('../middleware/auth')
const Errors = require("../errors/errors");

const router = express.Router()

router.post('/', auth, async (req, res) => {
    try {
        const {userId, startPoint, endPoint, size} = req.body

        const user = await User.findOne({_id, userId})

        if (user === null) {
            return res.status(400).send(Errors.noSuchUser)
        }

        const createdParcel = await Parcel.create({
            user: userId,
            startPoint: startPoint,
            endPoint: endPoint,
            size: size,
            status: 'CREATED'
        })

        createdParcel.user = user

        res.status(200).send(createdParcel)
    } catch (error) {
        res.status(400).send(error)
    }
})

router.get('/:id', auth, async (req, res) => {
    const {id} = req.params
    const parcel = await Parcel.findOne({_id: id})
    if (parcel === null) {
        return res.status(400).send(Errors.noSuchParcel)
    }
    res.status(200).send(parcel)
})

module.exports = router