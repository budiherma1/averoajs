const passport = require('passport')
const JwtStrategy = require('passport-jwt').Strategy,
	ExtractJwt = require('passport-jwt').ExtractJwt;
const opts = {}
const Users = require('./../app/Model/Users.js');

opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.TOKEN_SECRET;

passport.use(new JwtStrategy(opts, async function (jwt_payload, done) {
	const users = await Users.query().findById(jwt_payload.id);
	if (users) {
		return done(null, users);
	} else {
		return done(null, false);
	}
}));