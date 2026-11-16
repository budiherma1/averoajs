/**
 * Lets the request through only for a user whose email address is verified.
 * Put it after AuthMiddleware:
 *
 *   router.post('/', 'PostController@create', ['AuthMiddleware', 'EnsureEmailVerified']);
 *
 * 401 without a user, 403 { status: false, message, code: 'EMAIL_NOT_VERIFIED' } otherwise.
 */
class EnsureEmailVerified {
  handle(req, res, next) {
    if (!req.user) {
      return res.status(401).json({ status: false, message: 'Unauthorized' });
    }
    if (req.user.email_verified_at == null) {
      return res.status(403).json({ status: false, message: 'Your email address is not verified.', code: 'EMAIL_NOT_VERIFIED' });
    }
    return next();
  }
}

export default new EnsureEmailVerified();
