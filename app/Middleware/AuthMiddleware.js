const passport = require('passport');

class AuthMiddleware {
	handle(req, res, next) {
		passport.authenticate('jwt', { session: false }, function (err, user, info) {
			if (user) {
				return next();
			} else {
				return res.send('you are forbidden to access this route');
			}
		})(req, res, next);
	}
}

module.exports = new AuthMiddleware