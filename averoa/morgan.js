import morgan from 'morgan';
import fs from 'fs';
import path, { dirname } from 'path';

const __dirname = path.resolve();
const setMorgan = (app) => {
	var accessLogStream = fs.createWriteStream(path.join(__dirname, '/storages/logs/access.log'), { flags: 'a' })
	var accessLogStreamError = fs.createWriteStream(path.join(__dirname, '/storages/logs/error.log'), { flags: 'a' })
	
	app.use(morgan('combined', { stream: accessLogStream }))
	app.use(morgan('combined', { stream: accessLogStreamError, skip: function (req, res) { return res.statusCode < 400 } }))
	
	if (process.env.NODE_ENV !== 'production') {
		app.use(morgan('dev'))
	  }
}

export default setMorgan;