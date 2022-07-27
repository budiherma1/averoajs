import { JwtStrategy } from '../Strategies/index.js';

class AuthMiddleware {
  handle(req, res, next) {
    JwtStrategy.authenticate(req, res, next);
  }
}

export default new AuthMiddleware;
