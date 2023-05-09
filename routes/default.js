const express = require('express')
const log = require('../middleware/log')

const router = express.Router()

router.get('/', log, async (req, res) => {
    res.status(200).send({isWorking: true})
})

module.exports = router