const express = require('express');
const bcrypt = require('bcrypt');
const User = require('../models/user');
const Error = require('../errors/errors');
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const {email, password, fcmToken} = req.body;
        const user = await User.findOneAndUpdate({email}, {fcmToken})

        if (user === null) {
            res.status(404).send(Error.noSuchUser);
        } else {
            if (await bcrypt.compare(password, user.password)) {
                user.token = jwt.sign(
                    {email_id: user.email}, "LigoTokenKey", {}
                )
                user.password = null
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
