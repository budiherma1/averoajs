import { UserRepository } from '#repositories';

const MAX_FIELD = 254;
const text = (value) => (typeof value === 'string' ? value.slice(0, MAX_FIELD) : '');

/** Session login for the dashboard pages (passport sessions, app/Strategies/LocalStrategy.js). */
class SessionController {
  /** GET /login */
  create(req, res) {
    res.render('auth/login', { email: '', error: null });
  }

  /** POST /login: a failed attempt answers 422, which the login limiter counts. */
  async store(req, res, next) {
    const email = text(req.body?.email);
    const password = text(req.body?.password);
    const user = email && password ? await UserRepository.findByCredentials(email, password) : null;
    if (!user) {
      return res.status(422).render('auth/login', { email, error: 'Invalid email or password.' });
    }
    // passport >= 0.6 starts a new session here (no session fixation)
    return req.login(user, (err) => (err ? next(err) : res.redirect('/dashboard')));
  }

  /** POST /logout: passport >= 0.6 starts a new, empty session. Other devices stay signed in. */
  destroy(req, res, next) {
    req.logout((err) => (err ? next(err) : res.redirect('/login')));
  }
}

export default new SessionController();
