class Middleware {
	handle (req, res, next) {
		console.log('from middleware')
		next()
	}
}

export default new Middleware