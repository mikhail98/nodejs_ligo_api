const axios = require("axios")

const PropertiesProvider = require("../utils/propertiesProvider")

module.exports = async function sendMessageToTelegramBot(message) {
    if (process.env.PROD) {
        const token = PropertiesProvider.getTelegramBotToken()
        const chatId = PropertiesProvider.getTelegramChatId()
        const telegramUrl = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${message}`
        await axios.get(telegramUrl)
    }
}