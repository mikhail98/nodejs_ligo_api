const express = require('express')

const {Parcel} = require('../models/parcel')

const router = express.Router()

router.post('/parcel', async (req, res) => {
    const {parcel} = req.body

    const createdParcel = await Parcel.create({
        user: parcel.user,
        startPoint: parcel.startPoint,
        endPoint: parcel.endPoint,
        size: parcel.size,
        status: 'CREATED'
    })

    res.status(200).send(createdParcel)
})