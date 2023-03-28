const express = require('express');
const User = require('../models/user');
const Error = require('../errors/errors');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const email = req.body["email"]
        const password = req.body["password"]
        const fcmToken = req.body["fcmToken"]

        const user = await User.findOneAndUpdate({email: email}, {fcmToken: fcmToken})

        if (user === null) {
            res.status(404).send(Error.noSuchUser);
        } else {
            if (user.password === password) {
                res.status(201).send(user);
            } else {
                res.status(400).send(Error.wrongPassword);
            }
        }
    } catch (error) {
        res.status(400).send(error);
    }
});

module.exports = router;
