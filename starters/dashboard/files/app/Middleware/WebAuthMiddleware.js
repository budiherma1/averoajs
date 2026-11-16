/**
 * Pages that need a session login (routes/web.js): without one the browser is
 * sent to /login. The signed-in user is available to every view as `user`.
 * The JSON API uses AuthMiddleware (JWT) instead.
 */
class WebAuthMiddleware {
  handle(req, res, next) {
    if (!req.user) return res.redirect('/login');
    res.locals.user = req.user;
    return next();
  }
}

export default new WebAuthMiddleware();
