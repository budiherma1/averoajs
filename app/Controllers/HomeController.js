import Controller from './Controller.js';
import jwt from 'jsonwebtoken';
import {Rooms} from '@averoa/models';
import {DB, Log, Mail} from '@averoa/utilities';
// import {Rooms} from './../Models/index.js';

class HomeController extends Controller {

	async getDataTest(req, res) {
		let a = await DB.select().from('rooms');
		res.send(a)
	}
	
	async getData(req, res) {
		let a = await DB.select().from('rooms');

		res.send(a)
	}

	async real(req, res) {
		let a = await DB.select().from('rooms');
		res.send(a)
	}
	async login(req, res) {
		let payload = {
			username: 'budi',
			id: 1
		}
		Log.warn('test warning log')
		const token = jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '1d' })
		res.send('hello : '+token);
	}
	async obj(req, res) {
		Log.warn('test obj warning log')
		console.time("dbsave");
		// const room = await Rooms.query().findById(2);
		const room = await Rooms.query();
		console.timeEnd("dbsave");
		res.send(room)
	}
	async sendEmail(req, res) {
		this.Mail();
		res.send('sip');
	}
	async home(req, res) {
		// console.log(888)
		res.render('home');
	}
	async homeEdge(req, res) {
		res.render('welcome',{greeting: 'SIAPPPP'});
	}
	async upload(req, res) {
		// console.log(req.files)
		// console.log(req.body)
		res.send('upload sip');
	}

}

export default new HomeController;