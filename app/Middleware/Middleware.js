class Middleware {
	handle (req, res, next) {
		console.log(88888)
		next()
	}
}

module.exports = new Middleware