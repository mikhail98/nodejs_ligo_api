const express = require('express')
const log = require('../middleware/log')
const Extensions = require("../utils/extensions");

const router = express.Router()

router.get('/', log, async (req, res) => {
    res.status(200).send({isWorking: true})
})

router.get('/config', log, async (req, res) => {
    res.status(200).send({currencies: Extensions.getAvailableCurrencies()})
})

module.exports = router