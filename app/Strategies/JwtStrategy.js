import passport from 'passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { UserRepository, RefreshTokenRepository } from '#repositories';

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
        // access tokens from AuthService carry id, tv (token version) and sid (session)
        if (payload?.id == null || !Number.isInteger(payload.tv) || typeof payload.sid !== 'string') {
          return done(null, false);
        }
        const user = await UserRepository.findActiveById(payload.id);
        // logout-all and password resets increment users.token_version
        if (!user || Number(user.token_version ?? 0) !== payload.tv) return done(null, false);
        // logout and refresh token reuse revoke the session (refresh token family)
        const active = await RefreshTokenRepository.isFamilyActive(payload.sid, user.id);
        if (!active) return done(null, false);
        return done(null, user, { claims: payload });
      } catch (err) {
        return done(err);
      }
    }));
    this.configured = true;
  }

  /** Express middleware: sets req.user and req.auth (the token claims), or answers 401. */
  authenticate(req, res, next) {
    if (!this.configured) this.config();

    passport.authenticate('jwt', { session: false }, (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ status: false, message: 'Unauthorized' });
      }
      req.user = user;
      req.auth = info?.claims;
      return next();
    })(req, res, next);
  }
}

export default new JwtStrategy();
