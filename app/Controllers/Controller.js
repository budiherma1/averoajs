const DB = require('../../utility/DB.js');
const Log = require('../../utility/Log.js')
const Mail = require('../../utility/Mail.js')
const multer  = require('multer')

class Controller {
	constructor() {
		this.DB = DB;
		this.Log = Log;
		this.Mail = Mail;
		this.Upload = multer({ dest: './storages/tmp/' });
	}
}

module.exports = Controller;