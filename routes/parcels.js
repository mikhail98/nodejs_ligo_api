const express = require('express')

const {Parcel} = require('../models/parcel')
const auth = require('../middleware/auth')

const router = express.Router()

router.post('/', auth, async (req, res) => {
    try {
        const {parcel} = req.body

        const createdParcel = await Parcel.create({
            user: parcel.user,
            startPoint: parcel.startPoint,
            endPoint: parcel.endPoint,
            size: parcel.size,
            status: 'CREATED'
        })

        res.status(200).send(createdParcel)
    } catch (error) {
        res.status(400).send(error)
    }
})

module.exports = router