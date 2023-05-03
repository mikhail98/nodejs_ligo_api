const express = require('express')
const auth = require("../middleware/auth")
const axios = require('axios')

const router = express.Router()

const placesKey = "AIzaSyCSlmptrgECqtpqHpw1y7CzaqQWzMWUgto"
const directionsKey = "AIzaSyCx1eNQu54zl1ASzX5qu5CzjuPMF6FgC8w"

router.get('/places', auth, async (req, res) => {
    const text = req.query.query
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + text + '&key=' + placesKey

    axios.get(url)
        .then(response => {
            return res.status(200).send(response.data)
        })
        .catch(error => {
            return res.status(400).send(error)
        })
})

router.get('/directions', auth, async (req, res) => {
    const origin = req.query.origin
    const destination = req.query.destination
    const url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&departure_time=now' + '&mode=driving' + '&key=' + directionsKey

    axios.get(url)
        .then(response => {
            return res.status(200).send(response.data)
        })
        .catch(error => {
            return res.status(400).send(error)
        })
})

module.exports = router