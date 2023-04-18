const jwt = require("jsonwebtoken");
const Error = require('../errors/errors');

const verifyToken = (req, res, next) => {
    const token = req.headers["x-access-token"];

    if (!token) {
        return res.status(403).send(Error.requiredToken);
    }
    try {
        req.user = jwt.verify(token, "LigoTokenKey");
    } catch (err) {
        return res.status(401).send(Error.invalidToken);
    }
    return next();
};

module.exports = verifyToken;