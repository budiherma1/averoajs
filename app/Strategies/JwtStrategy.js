import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { Users } from '@averoa/models';

const opts = {};

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.TOKEN_SECRET;

class JwtStrategy {
  config() {
    passport.use(new Strategy(opts, (async (jwt_payload, done) => {
      const users = await Users.query().findById(jwt_payload.id);
      if (users) {
        return done(null, users);
      }
      return done(null, false);
    })));
  }

  authenticate(req, res, next) {
    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (user) {
        return next();
      }
      return res.send('you are forbidden to access this route');
    });
  }
}

export default new JwtStrategy();
