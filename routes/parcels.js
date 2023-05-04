const express = require('express')

const {Parcel} = require('../models/parcel')
const auth = require('../middleware/auth')
const Errors = require("../errors/errors");

const router = express.Router()

router.post('/', auth, async (req, res) => {
    try {
        const {user, startPoint, endPoint, size} = req.body

        const createdParcel = await Parcel.create({
            user: user,
            startPoint: startPoint,
            endPoint: endPoint,
            size: size,
            status: 'CREATED'
        })

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