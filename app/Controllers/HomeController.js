import Controller from './Controller.js';
import jwt from 'jsonwebtoken';
import {Rooms} from '@averoa/models';
import {DB, Log, Mail, Queue, Auth} from '@averoa/utilities';
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
		// let payload = {
		// 	username: 'budi',
		// 	id: 1
		// }
		// Log.warn('test warning log')
		// const token = jwt.sign(payload, process.env.TOKEN_SECRET, { expiresIn: '1d' })
		// res.send('hello : '+token);

		res.send('login sip')
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
	// async home(req, res) {

	// 	let aa = Mail.$init()
	// 	console.log(aa)
	// 	res.json(aa)
	// }
	async home(req, res) {
		// req.home = 'home'
		// Queue('test channel', {name: 'budi h', number: 8})
		// let mailOne = Mail
		let aa = await Mail.init().from('qafrom@mail.com')
		.to('qato@mail.com')
		.subject('anama subject')
		// .html('home', {emailVar: 7777777})
		.html('<h1>home</h1>')
		.queue('Email Channel')
		.text('atextttttt')
		.send();

		console.log(aa)
		let bb = await Mail.init().from('aaaa@mail.com')
		.to('aaaa@mail.com')
		// .subject('anama subject')
		// .html('home', {emailVar: 7777777})
		.html('<h1>aaaa</h1>')
		.queue('aaaa Channel')
		.text('aaaa')
		.send();
		console.log(bb)
		// console.log(req)
		// console.log(aa)
// console.log(this)
		res.json(aa)
	}
	async home2(req, res) {
		req.home2 = 'home2'
		// Queue('test channel', {name: 'budi h', number: 8})
		// let mailOne = Mail
		console.log('home2')
		let aa = await Mail.init().from('22222222@mail.com')
		// .to('qato@mail.com')
		// .subject('anama subject')
		// // .html('home', {emailVar: 7777777})
		// .html('<h1>home</h1>')
		.queue('chsnnel2')
		// .text('atextttttt')
		.send();

		console.log(aa)
		// console.log(req)
		// console.log(aa)

		res.json(aa)
	}
	async homeView(req, res) {
		res.render('home', {emailVar: 6986969869, users: [1,2,3,4,5,6]})
	}
	async loginView(req, res) {
		res.render('login', {emailVar: 6986969869, users: [1,2,3,4,5,6]})
	}
	async homeEdge(req, res) {
		console.log(Auth.check())
		console.log(Auth.user())
		res.render('welcome',{greeting: 'SIAPPPP'});
	}
	async upload(req, res) {
		console.log(req.files)
		console.log(req.body)
		res.send('upload sip');
	}

}

export default new HomeController;