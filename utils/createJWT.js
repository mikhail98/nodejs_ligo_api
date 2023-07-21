const createJWT = require("jsonwebtoken")

module.exports = (userId) => {
    return createJWT.sign({_id: userId}, "LigoTokenKey", {})
}