const User = require("../models/user");
const Trip = require("../models/trip");
const {Parcel} = require("../models/parcel");

async function getResponseTripsById(tripIdList) {
    return await Promise.all(tripIdList.map(async (tripId) => await getResponseTripById(tripId)))
}

async function getResponseTripById(_id) {
    const responseTrip = (await Trip.findOne({_id})).toObject()
    responseTrip.parcels = await Promise.all(
        responseTrip.parcels.map(async (parcelId) => {
            return await getResponseParcelById(parcelId)
        })
    )
    const user = await User.findOne({_id: responseTrip.driverId})
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseTrip.driver = user
    return responseTrip
}

async function getResponseParcelById(_id) {
    const responseParcel = (await Parcel.findOne({_id})).toObject()
    const user = await User.findOne({_id: responseParcel.userId})
    if (user) {
        user.password = null
        user.fcmTokens = []
    }
    responseParcel.user = user
    return responseParcel
}

module.exports = {
    getResponseTripsById, getResponseTripById, getResponseParcelById
}