
const env = require('./env.js');
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const passport = require('passport')
const route = require('./routes/index.js')
const { Model } = require('objection');
const DB = require('./utility/DB.js')
const cors = require('cors')

const whitelist = process.env.CORS_WHITELIST.split(",")
const corsOptions = {
  origin: function (origin, callback) {
    console.log(origin)
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}

app.use(cors(corsOptions))
app.use(passport.initialize())

require('./config/passport');
Model.knex(DB);

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/v1', route)

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

// console.log(require('crypto').randomBytes(64).toString('hex'))