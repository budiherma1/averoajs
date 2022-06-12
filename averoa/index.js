const env = require('./env.js');
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const passport = require('passport')
const apiRoute = require('./../routes/api.js')
const webRoute = require('./../routes/web.js')
const { Model } = require('objection');
const DB = require('./../utility/DB.js')
const cors = require('./cors');
const morgan = require('./morgan');
const { engine } = require('./edge-js');
const path = require('path')
const port = process.env.APP_PORT

morgan(app);

app.use(cors)
app.use(passport.initialize())

require('./../config/passport');
Model.knex(DB);

app.use(engine);
app.set('views', './../views');

app.use("/public", express.static(path.join(__dirname, '/../public')));

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', apiRoute)
app.use('/', webRoute)

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})