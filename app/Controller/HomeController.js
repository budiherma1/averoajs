import Controller from './Controller.js';
import Rooms from './../Model/Rooms.js';
import jwt from 'jsonwebtoken';

class HomeController extends Controller {

	async getDataTest(req, res) {

		let a = await this.DB.select().from('rooms');
		res.send(a)
	}
	
	async getData(req, res) {
		let a = await this.DB.select().from('rooms');

		res.send(a)
	}

	async real(req, res) {
		let a = await this.DB.select().from('rooms');
		res.send(a)
	}
	async login(req, res) {
		let payload = {
			username: 'budi',
			id: 1
		}
		this.Log.warn('test warning log')
		const token = jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '1d' })
		res.send('hello : '+token);
	}
	async obj(req, res) {
		// const room = await Rooms.query().findById(2);
		const room = await Rooms.query();
		res.send(room)
	}
	async sendEmail(req, res) {
		this.Mail();
		res.send('sip');
	}
	async home(req, res) {
		res.render('home');
	}
	async homeEdge(req, res) {
		res.render('welcome',{greeting: 'SIAPPPP'});
	}
	async upload(req, res) {
		console.log(req.files)
		console.log(req.body)
		res.send('upload sip');
	}

}

export default new HomeController;