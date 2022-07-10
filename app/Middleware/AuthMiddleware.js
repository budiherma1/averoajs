import { JwtStrategy } from '../Strategies/index.js';

class AuthMiddleware {
	handle(req, res, next) {
		JwtStrategy.validate(req, res, next)
	}
}

export default new AuthMiddleware