const express = require('express');
const User = require('../models/user');
const Trip = require('../models/trip');
const Error = require('../errors/errors');

const router = express.Router();

router.post('/', async (req, res) => {
    try {
        req.body["isValidated"] = !req.body["isDriver"]

        const user = new User(req.body);
        await user.save();
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

router.get('/:id', async (req, res) => {
    const user = await User.findOne({_id: req.params.id})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/location', async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {location: req.body["location"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/status', async (req, res) => {
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

router.patch('/:id/fcmToken', async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {fcmToken: req.body["fcmToken"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/passportPhoto', async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {passportPhotoUrl: req.body["passportPhotoUrl"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

router.patch('/:id/validate', async (req, res) => {
    const user = await User.findOneAndUpdate({_id: req.params.id}, {isValidated: req.body["isValidated"]})

    if (user === null) {
        res.status(404).send(Error.noSuchUser);
    } else {
        const user = await User.findOne({_id: req.params.id})
        user.password = null
        res.status(200).send(user);
    }
});

module.exports = router;
