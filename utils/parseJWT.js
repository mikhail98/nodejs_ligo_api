const jwt = require("jsonwebtoken")

module.exports = (token) => {
    let decoded = jwt.decode(token)
    return decoded
}