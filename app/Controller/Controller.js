import DB from '../../utility/DB.js';
import Log from '../../utility/Log.js';
import Mail from '../../utility/Mail.js';

class Controller {
	constructor(req, res) {
		this.DB = DB;
		this.Log = Log;
		this.Mail = Mail;
	}
}

export default Controller;