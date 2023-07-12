const log = (req, res, next) => {
    const startTime = (new Date()).getTime()
    res.on("finish", function() {
        const endTime = (new Date()).getTime()
        console.log(req.method, decodeURI(req.url), res.statusCode, res.statusMessage, endTime-startTime)
    });
    next();
}

module.exports = log