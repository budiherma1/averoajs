const createError = require('http-errors')

class ErrorMiddleware {
	handle(req, res, next) {
		return next(createError(401, 'Please login to view this page.'))
	}
}

module.exports = new ErrorMiddleware