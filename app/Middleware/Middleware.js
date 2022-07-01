// import test from '../../averoa/test.js'
class Middleware {
	handle (req, res, next) {
		// test.met(req);
		console.log('from middleware')
		next()
	}
}

export default new Middleware