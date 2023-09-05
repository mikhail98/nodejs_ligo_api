const router = require('express').Router()

const Error = require("../utils/errors")

const log = require('../middleware/log')

const DefaultService = require('../service/DefaultService')

router.get('/', log, async (req, res) => {
    // #swagger.tags = ['Default']

    try {
        return await DefaultService.isWorking(res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

router.get('/config', log, async (req, res) => {
    // #swagger.tags = ['Default']

    try {
        return await DefaultService.getConfig(res)
    } catch (error) {
        console.log(error)
        return res.status(400).send(Error.unknownError)
    }
})

module.exports = router