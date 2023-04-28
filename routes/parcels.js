const express = require('express')

const {Parcel} = require('../models/parcel')
const auth = require('../middleware/auth')

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

module.exports = router