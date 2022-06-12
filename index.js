
const env = require('./env.js');
const express = require('express')
const app = express()
const port = 3000
const bodyParser = require('body-parser')
const passport = require('passport')
const apiRoute = require('./routes/api.js')
const webRoute = require('./routes/web.js')
const { Model } = require('objection');
const DB = require('./utility/DB.js')
const cors = require('cors')
const fs = require('fs')
const morgan = require('morgan')
const path = require('path')
const { engine } = require('express-handlebars')
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

// create a write stream (in append mode)
var accessLogStream = fs.createWriteStream(path.join(__dirname, 'storages/logs/access.log'), { flags: 'a' })
var accessLogStreamError = fs.createWriteStream(path.join(__dirname, 'storages/logs/error.log'), { flags: 'a' })

// setup the logger
app.use(morgan('combined', { stream: accessLogStream }))
app.use(morgan('combined', { stream: accessLogStreamError, skip: function (req, res) { return res.statusCode < 400 } }))

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'))
}

app.get('/aa', function (req, res) {
  res.send('hello, world!')
})
// 
app.use(cors(corsOptions))
app.use(passport.initialize())

require('./config/passport');
Model.knex(DB);

// view
app.engine('handlebars', engine());
app.set('view engine', 'handlebars');
app.set('views', './resources/views');

app.use("/public", express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', apiRoute)
app.use('/', webRoute)

app.get('/test', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})