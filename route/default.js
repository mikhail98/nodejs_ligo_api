const router = require('express').Router()

const log = require('../middleware/log')

const DefaultService = require('../service/DefaultService')

router.get('/', log, async (req, res) => {
    // #swagger.tags = ['Default']

    return await DefaultService.isWorking(res)
})

router.get('/config', log, async (req, res) => {
    // #swagger.tags = ['Default']

    return await DefaultService.getConfig(res)
})

if (process.env.DEBUG) {
    router.get('/users228', log, async (req, res) => {
        return await DefaultService.getUsersCsv(res)
    })

    router.get('/trips228', log, async (req, res) => {
        return await DefaultService.getTripsCsv(res)
    })

    router.get('/parcels228', log, async (req, res) => {
        return await DefaultService.getParcelsCsv(res)
    })
}

module.exports = router