const express = require('express')
const auth = require("../middleware/auth")
const log = require('../middleware/log')
const axios = require('axios')
const properties = require("../local/properties")
const GooglePlace = require('../models/google_place')
const GoogleDirection = require('../models/google_direction')

const router = express.Router()

const placesKey = process.env.GOOGLE_PLACES_API_KEY || properties.GOOGLE_PLACES_API_KEY
const directionsKey = process.env.GOOGLE_DIRECTIONS_API_KEY || properties.GOOGLE_DIRECTIONS_API_KEY

const PLACES_UPDATE_INTERVAL_DAYS = 14
const DIRECTIONS_UPDATE_INTERVAL_DAYS = 14

router.get('/places', log, auth, async (req, res) => {
    const text = req.query.query

    const result = await GooglePlace.findOne({text})

    if (result) {
        const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

        if (Math.ceil(timeDifference / (86_400_000)) >= PLACES_UPDATE_INTERVAL_DAYS) {
            findAndSavePlace(text, res, result._id)
        } else {
            res.status(200).send(result.response)
        }
    } else {
        findAndSavePlace(text, res)
    }
})

function findAndSavePlace(text, res, resultId) {
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + text + '&key=' + placesKey

    axios.get(url)
        .then(response => {
            const data = response.data
            const dataString = JSON.stringify(data)
            if (resultId) {
                GooglePlace.updateOne({_id: resultId}, {response: dataString})
            } else {
                GooglePlace.create({
                    text: text,
                    response: dataString
                })
            }
            return res.status(200).send(dataString)
        })
        .catch(error => {
            return res.status(400).send(error)
        })
}

router.get('/directions', log, auth, async (req, res) => {
    const origin = req.query.origin
    const destination = req.query.destination

    const result = await GoogleDirection.findOne({origin, destination})

    if (result) {
        const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

        if (Math.ceil(timeDifference / (86_400_000)) >= DIRECTIONS_UPDATE_INTERVAL_DAYS) {
            findAndSaveDirection(origin, destination, res, result._id)
        } else {
            res.status(200).send(result.response)
        }
    } else {
        findAndSaveDirection(origin, destination, res)
    }
})

function findAndSaveDirection(origin, destination, res, resultId) {
    const url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&departure_time=now' + '&mode=driving' + '&key=' + directionsKey

    axios.get(url)
        .then(response => {
            const data = response.data
            const dataString = JSON.stringify(data)
            if (resultId) {
                GoogleDirection.updateOne({_id: resultId}, {response: dataString})
            } else {
                GoogleDirection.create({
                    origin: origin,
                    destination: destination,
                    response: dataString
                })
            }
            return res.status(200).send(data)
        })
        .catch(error => {
            return res.status(400).send(error)
        })
}

module.exports = router