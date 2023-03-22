const admin = require("firebase-admin");
const FCM = require('fcm-notification');
var serviceAccount = require("./pingo-demo-private-key.json");
const certPath = admin.credential.cert(serviceAccount);
const FCMClient = new FCM(certPath);

function sendPushNotification(fcmToken, title, body) {
    try {
        let message = {
            android: {
                notification: {
                    title: title,
                    body: body,
                },
                data: {
                    title: title,
                    body: body,
                },
            },
            token: fcmToken
        };

        FCMClient.send(message, function (error, resp) {
            if (error) {
                console.error('Notification sent unsuccessfully:', error);
            } else {
                console.log('Successfully sent notification');
            }
        });

    } catch (error) {
        console.error('Notification sent unsuccessfully:', error);
    }
}

 module.exports = sendPushNotification;