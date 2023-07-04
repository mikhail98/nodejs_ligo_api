const axios = require('axios')
const express = require('express')
const log = require('../middleware/log')
const Error = require('../errors/errors')
const auth = require("../middleware/auth")
const GooglePlace = require('../models/google_place')
const GoogleDirection = require('../models/google_direction')
const propertiesProvider = require('../utils/propertiesProvider')
const GoogleLocalization = require('../models/google_localization')

const router = express.Router()

const PLACES_UPDATE_INTERVAL_DAYS = 14
const DIRECTIONS_UPDATE_INTERVAL_DAYS = 14
const LOCALIZATION_UPDATE_INTERVAL_DAYS = 30

router.get('/places', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']
    const text = req.query.query

    const result = await GooglePlace.findOne({text})

    if (result) {
        const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

        if (timeDifference / 86_400_000 >= PLACES_UPDATE_INTERVAL_DAYS) {
            findAndSavePlace(text, res, result._id)
        } else {
            res.status(200).send(result.response)
        }
    } else {
        findAndSavePlace(text, res)
    }
})

function findAndSavePlace(text, res, resultId) {
    if (!text) {
        return res.status(400).send(Error.searchRequestRequired)
    }
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + text + '&key=' + propertiesProvider.getGooglePlacesApiKey()

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
    // #swagger.tags = ['Google']
    const origin = req.query.origin
    const destination = req.query.destination

    const result = await GoogleDirection.findOne({origin, destination})

    if (result) {
        const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

        if (timeDifference / 86_400_000 >= DIRECTIONS_UPDATE_INTERVAL_DAYS) {
            findAndSaveDirection(origin, destination, res, result._id)
        } else {
            if (result.response) {
                res.status(200).send(result.response)
            } else {
                res.status(400).send(Error.cantFindRoute)
            }
        }
    } else {
        findAndSaveDirection(origin, destination, res)
    }
})

function findAndSaveDirection(origin, destination, res, resultId) {
    if (!origin || !destination) {
        return res.status(400).send(Error.originAndDestinationRequired)
    }
    const url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&departure_time=now' + '&mode=driving' + '&key=' + propertiesProvider.getGoogleDirectionsApiKey()

    axios.get(url)
        .then(response => {
            const data = response.data

            const route = data.routes[0]
            const legs = route.legs[0]
            const jsonToSave = {
                points: route.overview_polyline.points,
                distance: legs.distance.value / 1000,
                duration: legs.duration.value
            }

            const dataString = JSON.stringify(jsonToSave)
            if (resultId) {
                GoogleDirection.updateOne({_id: resultId}, {response: dataString})
            } else {
                GoogleDirection.create({
                    origin: origin,
                    destination: destination,
                    response: dataString,
                    startAddress: legs.start_address,
                    endAddress: legs.end_address,
                })
            }
            return res.status(200).send(dataString)
        })
        .catch(error => {
            if (!resultId) {
                GoogleDirection.create({
                    origin: origin,
                    destination: destination,
                    response: null,
                    startAddress: null,
                    endAddress: null,
                })
            }
            return res.status(400).send(Error.cantFindRoute)
        })
}

router.get('/localization', log, async (req, res) => {
    // #swagger.tags = ['Google']
    await updateLocalisation(res, LOCALIZATION_UPDATE_INTERVAL_DAYS)
})

router.get('/parseLocalization', log, auth, async (req, res) => {
    // #swagger.tags = ['Google']
    await updateLocalisation(res, 0)
})

async function updateLocalisation(res, interval) {
    const result = await GoogleLocalization.findOne()

    if (result) {
        const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

        if (timeDifference / 86_400_000 >= interval) {
            findAndSaveLocalization(res, result._id)
        } else {
            res.status(200).send(result.localization)
        }
    } else {
        findAndSaveLocalization(res)
    }
}

function findAndSaveLocalization(res, resultId) {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/1Ln_RLoDZYsoPXoVjJIiOqJUb5hu1vpj0AKWrwsn5xss/values/A1:F1000?majorDimension=COLUMNS&key=' + propertiesProvider.getGoogleSheetsApiKey()

    axios.get(url)
        .then(response => updateExistedLocalization(response, resultId, res))
        .catch(error => {
            console.log(error)
            return res.status(400).send(error)
        })
}

async function updateExistedLocalization(response, resultId, res) {
    const data = response.data
    const keys = data.values[0]
    const values = data.values
    values.splice(0, 1)
    const localizations = values.map(value => mapLocalizationFromValues(keys, value))

    if (resultId) {
        await GoogleLocalization.updateOne({_id: resultId}, {localization: localizations})
    } else {
        await GoogleLocalization.create({localization: localizations})
    }
    return res.status(200).send(localizations)
}

function mapLocalizationFromValues(keys, values) {
    const localizationKey = values[0]
    const localizationValues = values.map((value, index) => {
        return {key: keys[index], value: value}
    })
    localizationValues.splice(0, 1)
    return {
        locale: localizationKey,
        keys: localizationValues
    }
}

module.exports = router