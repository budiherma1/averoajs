import passport from 'passport';
import { Strategy } from 'passport-local';
import { UserRepository } from '#repositories';

/**
 * Session (cookie) login with email + password, for server-rendered pages.
 * The JSON API uses JWT instead: see AuthController and JwtStrategy.
 */
class LocalStrategy {
  config() {
    passport.use('local', new Strategy({ usernameField: 'email', passwordField: 'password' }, async (email, password, done) => {
      try {
        const user = await UserRepository.findByCredentials(email, password);
        if (!user) return done(null, false, { message: 'Invalid email or password' });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }));

    // only the id goes into the session
    passport.serializeUser((user, done) => done(null, user.id));

    passport.deserializeUser(async (id, done) => {
      try {
        const user = await UserRepository.findActiveById(id);
        return done(null, user || false);
      } catch (err) {
        return done(err);
      }
    });
  }

  authenticate(req, res, next) {
    passport.authenticate('local')(req, res, next);
  }
}

export default new LocalStrategy();
