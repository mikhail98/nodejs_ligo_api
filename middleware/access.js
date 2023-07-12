const Error = require("../utils/errors");

module.exports = async function (req, res, next) {
    if (req.params.id.toString() !== req.user._id.toString()) {
        return res.status(403).send(Error.accessDenied)
    }
    return next()
}