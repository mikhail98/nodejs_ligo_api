const noSuchUser = createError(101, "No such user")
const noSuchTrip = createError(102, "No such trip")
const noSuchParcel = createError(103, "No such parcel")
const noSecretForThisParcel = createError(104, "No secret for this parcel")
const cantFindRoute = createError(105, "Can't find route")

const userExits = createError(201, "This user also exists")
const notADriver = createError(202, "Not a driver")

const wrongPassword = createError(301, "Wrong password")
const requiredToken = createError(302, "Token is required")
const invalidToken = createError(303, "Invalid token")
const youNeedAdminRights = createError(304, "You need to be an admin to do that")
const accessDenied = createError(305, "Access denied")
const notInYouTrip = createError(306, "This parcel is not in your trip")
const parcelInActiveTrip = createError(307, "This parcel is in active trip")
const provideTokenOrPassword = createError(308, "Provide token or password")

const driverHasActiveTrip = createError(401, "Driver has active an trip")
const pointsAreTheSame = createError(402, "startPoint can't be equal to endPoint")
const ratingExists = createError(403, "Rating exists")

function createError(code, msg) {
    return {
        errorCode: code,
        errorMessage: msg
    }
}

module.exports = {
    wrongPassword,
    noSuchUser,
    pointsAreTheSame,
    notADriver,
    userExits,
    noSuchParcel,
    requiredToken,
    invalidToken,
    youNeedAdminRights,
    noSuchTrip,
    driverHasActiveTrip,
    noSecretForThisParcel,
    accessDenied,
    notInYouTrip,
    parcelInActiveTrip,
    ratingExists,
    provideTokenOrPassword,
    cantFindRoute
}
