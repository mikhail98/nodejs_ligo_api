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
        return GooglePlace.findOne({text})
            .then(result => {
                if (result) {
                    const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

                    if (timeDifference / 86_400_000 >= PLACES_UPDATE_INTERVAL_DAYS) {
                        return findAndSavePlace(text, res, result._id)
                    } else {
                        return res.status(200).send(result.response)
                    }
                } else {
                    return findAndSavePlace(text, res)
                }
            })
            .catch(error => {
                console.log(error)
                return findAndSavePlace(text, res)
            })
    }

    static async getDirection(origin, destination, res) {
        return GoogleDirection.findOne({origin, destination})
            .then(result => {
                if (result) {
                    const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

                    if (timeDifference / 86_400_000 >= DIRECTIONS_UPDATE_INTERVAL_DAYS) {
                        return findAndSaveDirection(origin, destination, res, result._id)
                    } else {
                        if (result.response) {
                            return res.status(200).send(result.response)
                        } else {
                            return res.status(400).send(Error.cantFindRoute)
                        }
                    }
                } else {
                    return findAndSaveDirection(origin, destination, res)
                }
            })
            .catch(error => {
                console.log(error)
                return findAndSaveDirection(origin, destination, res)
            })
    }

    static async getLocalization(isInstant, res) {
        let interval
        if (isInstant) {
            interval = 0
        } else {
            interval = LOCALIZATION_UPDATE_INTERVAL_DAYS
        }
        return GoogleLocalization.findOne()
            .then(result => {
                if (result) {
                    const timeDifference = Math.abs(new Date(result.createdAt).getTime() - new Date().getTime())

                    if (timeDifference / 86_400_000 >= interval) {
                        return findAndSaveLocalization(res, result._id)
                    } else {
                        return res.status(200).send(result.localization)
                    }
                } else {
                    return findAndSaveLocalization(res)
                }
            })
            .catch(error => {
                console.log(error)
                return findAndSaveLocalization(res)
            })
    }
}

function findAndSavePlace(text, res, resultId) {
    if (!text) {
        return res.status(400).send(Error.searchRequestRequired)
    }
    const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json?query=' + text + '&key=' + propertiesProvider.getGooglePlacesApiKey()

    axios.get(url)
        .then(function (response) {
            const data = response.data
            const dataString = JSON.stringify(data)
            if (resultId) {
                return GooglePlace.updateOne({_id: resultId}, {response: dataString})
                    .then(() => {
                        return res.status(200).send(dataString)
                    })
            } else {
                return GooglePlace.create({text: text, response: dataString})
                    .then(() => {
                        return res.status(200).send(dataString)
                    })
            }
        })
        .catch(error => {
            return res.status(400).send(error)
        })
}

function findAndSaveDirection(origin, destination, res, resultId) {
    if (!origin || !destination) {
        return res.status(400).send(Error.originAndDestinationRequired)
    }
    const url = 'https://maps.googleapis.com/maps/api/directions/json?origin=' + origin + '&destination=' + destination + '&departure_time=now' + '&mode=driving' + '&key=' + propertiesProvider.getGoogleDirectionsApiKey()

    axios.get(url)
        .then(function (response) {
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
                return GoogleDirection.updateOne({_id: resultId}, {response: dataString})
                    .then(() => {
                        return res.status(200).send(dataString)
                    })
            } else {
                return GoogleDirection.create({
                    origin: origin,
                    destination: destination,
                    response: dataString,
                    startAddress: legs.start_address,
                    endAddress: legs.end_address,
                })
                    .then(() => {
                        return res.status(200).send(dataString)
                    })
            }
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
                    .then(() => {
                        return res.status(400).send(Error.cantFindRoute)
                    })
            } else {
                console.log(error)
                return res.status(400).send(Error.unknownError)
            }
        })
}

function findAndSaveLocalization(res, resultId) {
    const url = 'https://sheets.googleapis.com/v4/spreadsheets/1Ln_RLoDZYsoPXoVjJIiOqJUb5hu1vpj0AKWrwsn5xss/values/A1:F1000?majorDimension=COLUMNS&key=' + propertiesProvider.getGoogleSheetsApiKey()

    axios.get(url)
        .then(function (response) {
            const data = response.data
            const keys = data.values[0]
            const values = data.values
            values.splice(0, 1)
            const localizations = values.map(value => mapLocalizationFromValues(keys, value))

            if (resultId) {
                return GoogleLocalization.updateOne({_id: resultId}, {localization: localizations})
                    .then(() => {
                        return res.status(200).send(localizations)
                    })
            } else {
                return GoogleLocalization.create({localization: localizations})
                    .then(() => {
                        return res.status(200).send(localizations)
                    })
            }
        })
        .catch(error => {
            console.log(error)
            return res.status(400).send(error)
        })
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