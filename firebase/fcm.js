const admin = require("firebase-admin")
const FCM = require('fcm-notification')
const serviceAccount = require("./pingo-demo-private-key.json")
const certPath = admin.credential.cert(serviceAccount)
const User = require("../models/user")
const FCMClient = new FCM(certPath)

async function sendPushNotification(fcmToken, data, callback) {
    try {
        let message = {
            android: {
                data: data,
            },
            token: fcmToken
        }

        FCMClient.send(message, function (error, resp) {
            callback(fcmToken, !error)
        })

    } catch (error) {
        callback(fcmToken, false)
    }
}

async function sendPushNotifications(userId, data) {
    const user = await User.findOne({_id: userId})
    if (!user) return

    const sourceTokens = user.fcmTokens
    const resultTokens = []
    sourceTokens.forEach(token => {
        sendPushNotification(token, data, async function (token, isSuccessful) {
            if (isSuccessful) {
                resultTokens.push(token)
            } else {
                resultTokens.push(null)
            }
            if (resultTokens.length === sourceTokens.length) {
                console.log(resultTokens)
                await User.updateOne({_id: userId}, {fcmTokens: resultTokens.filter(token => token)})
            }
        })
    })
}

module.exports = sendPushNotifications
