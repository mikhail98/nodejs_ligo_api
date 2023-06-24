const swaggerAutogen = require('swagger-autogen')()

const outputFile = './swagger/swagger.json'
const endpointsFiles = [
    './routes/auth.js',
    './routes/default.js',
    './routes/google.js',
    './routes/parcels.js',
    './routes/trips.js',
    './routes/users.js',
]

swaggerAutogen(outputFile, endpointsFiles)