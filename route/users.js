const router = require('express').Router()

const log = require('../middleware/log')
const auth = require('../middleware/auth')
const access = require('../middleware/access')

const UserService = require("../service/UserService")

//create user
router.post('/', log, async (req, res) => {
    // #swagger.tags = ['Users']

    const {name, email, phone, role, fcmToken, googleToken} = req.body
    return await UserService.createUser(name, email, phone, role, fcmToken, googleToken, res)
})

//get user by id
router.get('/:id', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    return await UserService.getUserById(req.user, res)
})

router.post('/exists', log, async (req, res) => {
    // #swagger.tags = ['Users']

    const {email} = req.body
    return UserService.getUserExists(email, res)
})

//update user fcm token
router.patch('/:id/fcmToken', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    const {fcmToken} = req.body
    return UserService.updateFcmToken(req.user, fcmToken, res)
})

//update user avatar
router.patch('/:id/avatarPhoto', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    const {avatarPhoto} = req.body
    return UserService.updateAvatarPhoto(req.user, avatarPhoto, res)
})

//update user passport
router.patch('/:id/passportPhoto', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    const {passportPhoto} = req.body
    return UserService.updatePassportPhoto(req.user, passportPhoto, res)
})

//feedback user
router.patch('/:id/rating/:rating', log, auth, async (req, res) => {
    // #swagger.tags = ['Users']

    const userFrom = req.user._id
    const userTo = req.params.id
    const rating = req.params.rating
    return UserService.updateUserRating(userFrom, userTo, rating, res)
})

//update user location
router.patch('/:id/location', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    const {location} = req.body
    return UserService.updateDriverLocation(req.user._id, location, res)
})

router.get('/:id/driverTrips', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    return UserService.getDriverTrips(req.params._id, res)
})

router.get('/:id/senderParcels', log, auth, access, async (req, res) => {
    // #swagger.tags = ['Users']

    return UserService.getSenderParcels(req.params._id, res)
})

// //update user location
// router.patch('/:id/location', log, auth, async (req, res) => {
//     // #swagger.tags = ['Users']
//     const _id = req.params.id
//     const {location} = req.body
//     const user = await User.findOneAndUpdate({_id}, {location: location})
//
//     if (!user) {
//         return res.status(400).send(Error.noSuchUser)
//     }
//     const trip = await Trip.findOne({driverId: _id, status: {$in: ['ACTIVE', 'SCHEDULED']}})
//     if (trip) {
//         // const responseTrip = await Extensions.getResponseTripById(trip._id)
//         // responseTrip.parcels
//         //     .filter(parcel => parcel.status === 'ACCEPTED' || parcel.status === 'PICKED')
//         //     .map(parcel => parcel.userId)
//         //     .forEach(userId => socket.emitEvent(userId, "driverLocationUpdated", location))
//         //
//         // const parcels = await Parcel.find({status: 'CREATED'})
//         // const parcelIds = parcels.map(parcel => parcel._id.toString())
//
//         // Promise.allSettled(parcelIds.map(parcelId => Extensions.requestDriverForParcel(parcelId)))
//         //     .then(() => {
//         //     })
//         //     .catch(() => {
//         //     })
//     }
//     res.status(200).send()
// })


module.exports = router
