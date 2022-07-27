import createError from 'http-errors';

class ErrorMiddleware {
  handle(req, res, next) {
    return next(createError(401, 'Please login to view this page.'));
  }
}

export default new ErrorMiddleware;
