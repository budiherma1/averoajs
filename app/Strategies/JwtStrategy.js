import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserRepository } from '#repositories';

export const JWT_ALGORITHM = 'HS256';

/** Reads TOKEN_SECRET and fails fast when it is missing. */
export function tokenSecret() {
  const secret = process.env.TOKEN_SECRET;
  if (!secret) {
    throw new Error('TOKEN_SECRET is not set. Generate one with `npm run generate:token` (or `openssl rand -hex 64`) and put it in .env');
  }
  return secret;
}

class JwtStrategy {
  constructor() {
    this.configured = false;
  }

  /** Registers the "jwt" passport strategy. Called by @averoa/core at startup. */
  config() {
    passport.use('jwt', new Strategy({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: tokenSecret(),
      algorithms: [JWT_ALGORITHM],
    }, async (payload, done) => {
      try {
        const user = payload?.id != null ? await UserRepository.findActiveById(payload.id) : null;
        return done(null, user || false);
      } catch (err) {
        return done(err);
      }
    }));
    this.configured = true;
  }

  /** Express middleware: sets req.user and continues, or answers 401. */
  authenticate(req, res, next) {
    if (!this.configured) this.config();

    passport.authenticate('jwt', { session: false }, (err, user) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ status: false, message: 'Unauthorized' });
      }
      req.user = user;
      return next();
    })(req, res, next);
  }
}

export default new JwtStrategy();
