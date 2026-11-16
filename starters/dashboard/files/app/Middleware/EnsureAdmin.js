import createError from 'http-errors';
import { Gate } from '@averoa/utilities';

/**
 * Admin-only pages: the 'admin' ability of app/Providers/AuthProvider.js.
 * Others get the 403 error page. Use after WebAuthMiddleware.
 */
class EnsureAdmin {
  async handle(req, res, next) {
    if (await Gate.allows(req.user, 'admin')) return next();
    return next(createError(403, 'This page is for administrators.'));
  }
}

export default new EnsureAdmin();
