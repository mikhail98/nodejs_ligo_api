const noSuchUser = createError(101, "No such user")
const noSuchTrip = createError(102, "No such trip")
const noSuchParcel = createError(103, "No such parcel")

const userExits = createError(201, "This user also exists")
const notADriver = createError(202, "Not a driver")

const wrongPassword = createError(301, "Wrong password")
const requiredToken = createError(302, "Token is required")
const invalidToken = createError(303, "Invalid token")
const youNeedAdminRights = createError(304, "You need to be an admin to do that")
const noSecretForThisParcel = createError(305, "No secret for this parcel")
const accessDenied = createError(306, "Access denied")

const driverHasActiveTrip = createError(401, "Driver has active an trip")
const pointsAreTheSame = createError(402, "startPoint can't be equal to endPoint")

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
    accessDenied
}
