const cors = require('cors')

const whitelist = process.env.CORS_WHITELIST.split(",")
const corsOptions = {
  origin: function (origin, callback) {
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

module.exports = cors(corsOptions);