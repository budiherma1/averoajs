class Middleware {
	handle (req, res, next) {
		console.log('from middleware')
		next()
	}
}

module.exports = new Middleware