import passport from 'passport';
import { Strategy } from 'passport-local';
import { Users } from '@averoa/models';

class LocalStrategy {
  config() {
    const authUser = (user, password, done) => {
      console.log(`Value of "User" in authUser function ----> ${user}`); // passport will populate, user = req.body.username
      console.log(`Value of "Password" in authUser function ----> ${password}`); // passport will popuplate, password = req.body.password

      // Use the "user" and "password" to search the DB and match user/password to authenticate the user
      // 1. If the user not found, done (null, false)
      // 2. If the password does not match, done (null, false)
      // 3. If user found and password match, done (null, user)

      const authenticated_user = { id: 123, name: 'Kyle' };
      // Let's assume that DB search that user found and password matched for Kyle

      return done(null, authenticated_user);
    };

    passport.use(new Strategy(authUser));

    passport.serializeUser((user, done) => {
      console.log('--------> Serialize User');
      console.log(user);

      done(null, user);

      // Passport will pass the authenticated_user to serializeUser as "user"
      // This is the USER object from the done() in auth function
      // Now attach using done (null, user.id) tie this user to the req.session.passport.user = {id: user.id},
      // so that it is tied to the session object
    });

    passport.deserializeUser((id, done) => {
      console.log('---------> Deserialize Id');
      console.log(id);

      done(null, { name: 'Kyle', id: 123 });

      // This is the id that is saved in req.session.passport.{ user: "id"} during the serialization
      // use the id to find the user in the DB and get the user object with user details
      // pass the USER object in the done() of the de-serializer
      // this USER object is attached to the "req.user", and can be used anywhere in the App.
    });
  }

  authenticate(req, res, next) {
    passport.authenticate('local')(req, res, next);
  }
}

export default new LocalStrategy;
