import { JwtStrategy } from '#strategies';

class AuthMiddleware {
  handle(req, res, next) {
    JwtStrategy.authenticate(req, res, next);
  }
}

export default new AuthMiddleware();
