const DB = require('../../utility/DB.js');
const Log = require('../../utility/Log.js')
const Mail = require('../../utility/Mail.js')

class Controller {
	constructor() {
		this.DB = DB;
		this.Log = Log;
		this.Mail = Mail;
	}
}

module.exports = Controller;