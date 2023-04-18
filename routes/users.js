const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Trip = require('../models/trip');
const Error = require('../errors/errors');
const auth = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        const {name, email, password, isDriver, isActive, fcmToken} = req.body;

        const oldUser = await User.findOne({email});

        if (oldUser) {
            return res.status(404).send(Error.userExits)
        }

        const encryptedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            name: name,
            email: email.toLowerCase(),
            password: encryptedPassword,
            isDriver: isDriver,
            isActive: isActive,
            isValidated: !isDriver,
            fcmToken: fcmToken
        });
        user.token = jwt.sign(
            {email_id: user.email}, "LigoTokenKey", {}
        )
        user.password = null
        res.status(200).send(user);
    } catch (error) {
        res.status(400).send(error);
    }
});

router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).send(users);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/drivers', async (req, res) => {
    try {
        const drivers = await User.find({isDriver: true});
        drivers.forEach(driver => driver.password = null)
        res.status(200).send(drivers);
    } catch (error) {
        res.status(500).send(error);
    }
});

router.get('/:id', auth, async (req, res) => {
    const user = await User.findOne({_id: req.params.id})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/location', auth, async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {location: req.body["location"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/status', auth, async (req, res) => {
    const isActive = req.body["isActive"]
    const driverId = req.params.id
    const user = await User.findOneAndUpdate({_id: req.params.id}, {isActive: isActive})

    if (!isActive) {
        await Trip.findOneAndRemove({driver: driverId})
    }

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/fcmToken', auth, async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {fcmToken: req.body["fcmToken"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/passportPhoto', auth, async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {passportPhotoUrl: req.body["passportPhotoUrl"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/validate', auth, async (req, res) => {
    const user = await User.findOne({_id: req.params.id})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        if (user.isDriver === false) {
            res.status(404).send(Error.notADriver);
        } else {
            await User.findOneAndUpdate({_id: req.params.id}, {isValidated: req.body["isValidated"]})
            const responseUser = await User.findOne({_id: req.params.id})
            responseUser.password = null
            res.status(200).send(responseUser);
        }
    }
});

module.exports = router;
