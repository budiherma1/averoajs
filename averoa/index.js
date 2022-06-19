import env from './env.js';
import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import apiRoute from './../routes/api.js';
import webRoute from './../routes/web.js';
import { Model } from 'objection';
import DB from './../utility/DB.js';
import cors from './cors.js';
import morgan from './morgan.js';
import engine from './edge-js.js';
import path from 'path';
import passportConfig from './../config/passport.js';

const app = express()
const port = process.env.APP_PORT;
const __dirname = path.resolve();

export default () => {

  morgan(app);
  
  app.use(cors)
  app.use(passport.initialize())
  
  passportConfig();
  Model.knex(DB);
  
  app.use(engine);
  app.set('views', './../views');
  
  app.use("/public", express.static(path.join(__dirname, '/public')));
  
  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))
  
  app.use('/api', apiRoute)
  app.use('/', webRoute)
  
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })
}