function getMongoUrl() {
    let mongoUrl = process.env.MONGODB_URL
    if (!mongoUrl) {
        const {MONGODB_URL} = require('./properties')
        mongoUrl = MONGODB_URL
    }
    return mongoUrl
}

function getGooglePlacesApiKey() {
    let googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!googlePlacesApiKey) {
        const {GOOGLE_PLACES_API_KEY} = require('./properties')
        googlePlacesApiKey = GOOGLE_PLACES_API_KEY
    }
    return googlePlacesApiKey
}

function getGoogleDirectionsApiKey() {
    let googleDirectionsApiKey = process.env.GOOGLE_DIRECTIONS_API_KEY
    if (!googleDirectionsApiKey) {
        const {GOOGLE_DIRECTIONS_API_KEY} = require('./properties')
        googleDirectionsApiKey = GOOGLE_DIRECTIONS_API_KEY
    }
    return googleDirectionsApiKey
}

function getGoogleSheetsApiKey() {
    let googleSheetsApiKey = process.env.GOOGLE_SHEETS_API_KEY
    if (!googleSheetsApiKey) {
        const {GOOGLE_SHEETS_API_KEY} = require('./properties')
        googleSheetsApiKey = GOOGLE_SHEETS_API_KEY
    }
    return googleSheetsApiKey
}

function getGoogleWebAuthClientId() {
    let googleWebAuthClientId = process.env.GOOGLE_WEB_AUTH_CLIENT_ID
    if (!googleWebAuthClientId) {
        const {GOOGLE_WEB_AUTH_CLIENT_ID} = require('./properties')
        googleWebAuthClientId = GOOGLE_WEB_AUTH_CLIENT_ID
    }
    return googleWebAuthClientId
}

function getGoogleIosAuthClientId() {
    let googleIosAuthClientId = process.env.GOOGLE_IOS_AUTH_CLIENT_ID
    if (!googleIosAuthClientId) {
        const {GOOGLE_IOS_AUTH_CLIENT_ID} = require('./properties')
        googleIosAuthClientId = GOOGLE_IOS_AUTH_CLIENT_ID
    }
    return googleIosAuthClientId
}

function getTelegramBotToken() {
    let telegramBotToken = process.env.TELEGRAM_BOT_TOKEN
    if (!telegramBotToken) {
        const {TELEGRAM_BOT_TOKEN} = require('./properties')
        telegramBotToken = TELEGRAM_BOT_TOKEN
    }
    return telegramBotToken
}

function getTelegramChatId() {
    let telegramChatId = process.env.TELEGRAM_CHAT_ID
    if (!telegramChatId) {
        const {TELEGRAM_CHAT_ID} = require('./properties')
        telegramChatId = TELEGRAM_CHAT_ID
    }
    return telegramChatId
}

module.exports = {
    getMongoUrl,
    getGooglePlacesApiKey,
    getGoogleDirectionsApiKey,
    getGoogleSheetsApiKey,
    getGoogleWebAuthClientId,
    getGoogleIosAuthClientId,
    getTelegramBotToken,
    getTelegramChatId
}