/** The login page is for guests: a signed-in user goes to the dashboard. */
class RedirectIfAuthenticated {
  handle(req, res, next) {
    if (req.user) return res.redirect('/dashboard');
    return next();
  }
}

export default new RedirectIfAuthenticated();
