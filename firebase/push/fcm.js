const admin = require("firebase-admin")
const FCM = require('fcm-notification')
const serviceAccount = require("./pingo-demo-private-key.json")
const certPath = admin.credential.cert(serviceAccount)
const FCMClient = new FCM(certPath)

function sendPushNotification(fcmToken, data) {
    try {
        let message = {
            android: {
                data: data,
            },
            token: fcmToken
        }

        FCMClient.send(message, function (error, resp) {
            if (error) {
                console.error('Notification sent unsuccessfully:', error)
            } else {
                console.log('Successfully sent notification')
            }
        })

    } catch (error) {
        console.error('Notification sent unsuccessfully:', error)
    }
}

module.exports = sendPushNotification