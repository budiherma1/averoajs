import Controller from './Controller.js';
import jwt from 'jsonwebtoken';
import {Rooms} from '@averoa/models';
import {DB, Log, Mail, Queue} from '@averoa/utilities';
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
		Mail();
		res.send('sip');
	}
	async home(req, res) {
		// Queue('test channel', {name: 'budi h', number: 8})
		let aa = await Mail.from('qafrom@mail.com')
		.to('qato@mail.com')
		.subject('anama subject')
		// .html('home', {emailVar: 7777777})
		.html('<h1>home</h1>')
		.queue('Email Channel')
		.text('atextttttt')
		.send();
		// console.log(aa)

		res.json(aa)
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