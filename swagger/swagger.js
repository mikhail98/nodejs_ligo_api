const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger/swagger.json'
const endpointsFiles = [
    './route/auth.js',
    './route/default.js',
    './route/google.js',
    './route/parcels.js',
    './route/trips.js',
    './route/users.js',
]

swaggerAutogen(outputFile, endpointsFiles)