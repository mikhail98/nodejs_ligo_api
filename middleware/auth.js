const jwt = require("jsonwebtoken")
const User = require('../model/user')
const Error = require('../utils/errors')

module.exports = async function (req, res, next) {
    const token = req.headers["x-access-token"]

    if (!token) {
        return res.status(403).send(Error.requiredToken)
    }

    try {
        const _id = jwt.verify(token, "LigoTokenKey")._id
        const user = await User.findOne({_id})
        if (user) {
            req.user = user
        } else {
            return res.status(401).send(Error.noSuchUser)
        }
    } catch (err) {
        return res.status(401).send(Error.invalidToken)
    }
    return next()
}