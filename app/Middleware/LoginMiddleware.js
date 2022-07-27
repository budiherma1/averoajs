import { LocalStrategy } from '../Strategies/index.js';

class LoginMiddleware {
  handle(req, res, next) {
    LocalStrategy.authenticate(req, res, next);
  }
}

export default new LoginMiddleware;
