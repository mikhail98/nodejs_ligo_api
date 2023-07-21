const log = (req, res, next) => {
    const startTime = (new Date()).getTime()
    res.on("finish", function() {
        const endTime = (new Date()).getTime()
        console.log(req.method, res.statusCode, decodeURI(req.url), `(${endTime-startTime}ms)`)
    });
    next();
}

module.exports = log