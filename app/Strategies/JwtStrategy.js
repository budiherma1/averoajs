import passport from 'passport';
import {Strategy, ExtractJwt} from 'passport-jwt';
const opts = {}
import { Users } from '@averoa/models';

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.TOKEN_SECRET;

class JwtStrategy {
	config() {
		passport.use(new Strategy(opts, async function (jwt_payload, done) {
			const users = await Users.query().findById(jwt_payload.id);
			if (users) {
				return done(null, users);
			} else {
				return done(null, false);
			}
		}));
	}

	authenticate(req, res, next) {
		passport.authenticate('jwt', { session: false }, function (err, user, info) {
			if (user) {
				return next();
			} else {
				return res.send('you are forbidden to access this route');
			}
		});
	}
}

export default new JwtStrategy;