const DB = require('../../utility/DB.js');
const Log = require('../../utility/Log.js')

class Controller {
	constructor() {
		this.DB = DB;
		this.Log = Log;
	}
}

module.exports = Controller;