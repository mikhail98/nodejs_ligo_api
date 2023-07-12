const axios = require("axios")

const GooglePlace = require("../model/google_place")
const GoogleDirection = require("../model/google_direction")
const GoogleLocalization = require("../model/google_localization")

const Error = require("../utils/errors")
const propertiesProvider = require("../utils/propertiesProvider")

const PLACES_UPDATE_INTERVAL_DAYS = 14
const DIRECTIONS_UPDATE_INTERVAL_DAYS = 14
const LOCALIZATION_UPDATE_INTERVAL_DAYS = 30

class GoogleService {

    static async getPlacesByText(text, res) {
        const result = await GooglePlace.findOne({text})
        if (result) {
            const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

            if (timeDifference / 86_400_000 >= PLACES_UPDATE_INTERVAL_DAYS) {
                return await findAndSavePlace(text, res, result._id)
            } else {
                return res.status(200).send(result.response)
            }
        } else {
            return await findAndSavePlace(text, res)
        }
    }

    static async getDirection(origin, destination, res) {
        const result = await GoogleDirection.findOne({origin, destination})
        if (result) {
            const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

            if (timeDifference / 86_400_000 >= DIRECTIONS_UPDATE_INTERVAL_DAYS) {
                return await findAndSaveDirection(origin, destination, res, result._id)
            } else {
                if (result.response) {
                    return res.status(200).send(result.response)
                } else {
                    return res.status(400).send(Error.cantFindRoute)
                }
            }
        } else {
            return await findAndSaveDirection(origin, destination, res)
        }
    }

    static async getLocalization(isInstant, res) {
        let interval
        if (isInstant) {
            interval = 0
        } else {
            interval = LOCALIZATION_UPDATE_INTERVAL_DAYS
        }
        const result = await GoogleLocalization.findOne()
        if (result) {
            const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

            if (timeDifference / 86_400_000 >= interval) {
                return await findAndSaveLocalization(res, result._id)
            } else {
                return res.status(200).send(result.localization)
            }
        } else {
            return await findAndSaveLocalization(res)
        }
    }
}

async function findAndSavePlace(text, res, resultId) {
    if (!text) {
        return res.status(400).send(Error.searchRequestRequired)
    }
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + text + '&key=' + propertiesProvider.getGooglePlacesApiKey()

    const response = await axios.get(url)
    const data = response.data
    const dataString = JSON.stringify(data)
    if (resultId) {
        await GooglePlace.updateOne({_id: resultId}, {response: dataString})
    } else {
        await GooglePlace.create({text: text, response: dataString})
    }
    return res.status(200).send(dataString)
}

async function findAndSaveDirection(origin, destination, res, resultId) {
    if (!origin || !destination) {
        return res.status(400).send(Error.originAndDestinationRequired)
    }
    const url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&departure_time=now' + '&mode=driving' + '&key=' + propertiesProvider.getGoogleDirectionsApiKey()

    try {
        const response = await axios.get(url)

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
            await GoogleDirection.updateOne({_id: resultId}, {response: dataString})
        } else {
            await GoogleDirection.create({
                origin: origin,
                destination: destination,
                response: dataString,
                startAddress: legs.start_address,
                endAddress: legs.end_address,
            })
        }
        res.status(200).send(dataString)
    } catch (error) {
        console.log(error)
        if (!resultId) {
            await GoogleDirection.create({
                origin: origin,
                destination: destination,
                response: null,
                startAddress: null,
                endAddress: null,
            })
            return res.status(400).send(Error.cantFindRoute)
        } else {
            console.log(error)
            return res.status(400).send(Error.unknownError)
        }
    }

}

async function findAndSaveLocalization(res, resultId) {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/1Ln_RLoDZYsoPXoVjJIiOqJUb5hu1vpj0AKWrwsn5xss/values/A1:F1000?majorDimension=COLUMNS&key=' + propertiesProvider.getGoogleSheetsApiKey()

    const response = await axios.get(url)
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

module.exports = GoogleService