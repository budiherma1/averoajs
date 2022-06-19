import passport from 'passport';
import {Strategy, ExtractJwt} from 'passport-jwt';
const opts = {}
import Users from './../app/Model/Users.js';

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.TOKEN_SECRET;

const passportConfig = () => {

	passport.use(new Strategy(opts, async function (jwt_payload, done) {
		const users = await Users.query().findById(jwt_payload.id);
		if (users) {
			return done(null, users);
		} else {
			return done(null, false);
		}
	}));
}

export default passportConfig;