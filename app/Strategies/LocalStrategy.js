import passport from 'passport';
import {Strategy, ExtractJwt} from 'passport-jwt';
const opts = {}
import { Users } from '@averoa/models';

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.TOKEN_SECRET;

class LocalStrategy {
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

	validate(req, res, next) {
		console.log('AppProvider end')
	}
}

export default new LocalStrategy;