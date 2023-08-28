const User = require("../model/user")

const FCM = require('fcm-notification')
const FCMClient = new FCM(require("firebase-admin").credential.cert(require("./ligo-private-key.json")))

async function sendPushNotifications(userId, data) {
    const user = await User.findOne({_id: userId})
    if (!user) return
    const sourceTokens = user.fcmTokens

    for await (const token of sourceTokens) {
        await sendPushNotification(token, data, function (token, isSuccessful) {})
    }
}

async function sendPushNotification(fcmToken, data, callback) {
    try {
        let message = {
            android: {
                data : { data: JSON.stringify(data) }
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
        console.log(error)
        callback(fcmToken, false)
    }
}

module.exports = sendPushNotifications
