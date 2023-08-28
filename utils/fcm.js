const User = require("../model/user")

const FCM = require('fcm-notification')
const FCMClient = new FCM(require("firebase-admin").credential.cert(require("./ligo-private-key.json")))

async function sendPushNotification(fcmToken, data, callback) {
    try {
        let message = {
            android: {
                data: data
            },
            apns: {
                payload: {
                    aps: {
                        alert: {
                            locKey: data.key,
                            locArgs: [JSON.stringify(data)]
                        },
                        'mutable-content': 1
                    }
                }
            },
            token: fcmToken
        }

        FCMClient.send(message, function (error) {
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
                await User.updateOne({_id: userId}, {fcmTokens: resultTokens.filter(token => token)})
            }
        })
    })
}

module.exports = sendPushNotifications
