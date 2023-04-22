const wrongPassword = createError("Wrong password")
const noSuchUser = createError("No such user")
const userExits = createError("This user also exists")
const notADriver = createError("Not a driver")
const requiredToken = createError("Token is required")
const invalidToken = createError("Invalid token")
const pointsAreTheSame = createError("startPoint can't be equal to endPoint")
const youNeedAdminRights = createError("You need to be an admin to do that")

function createError(msg) {
    return {
        errorMessage: msg
    }
}

module.exports = {
    wrongPassword, noSuchUser, pointsAreTheSame, notADriver, userExits, requiredToken, invalidToken, youNeedAdminRights
}
