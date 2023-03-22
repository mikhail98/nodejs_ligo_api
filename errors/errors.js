const wrongPassword = createError("Wrong password")
const noSuchUser = createError("No such user")
const pointsAreTheSame = createError("startPoint can't be equal to endPoint")

function createError(msg) {
    return {
        errorMessage: msg
    }
}

module.exports = {
    wrongPassword, noSuchUser, pointsAreTheSame
}
