// Global middleware, run on every route declared with @averoa/routes. Entries are
// middleware names (files in app/Middleware, e.g. 'AuthMiddleware'), functions, or
// objects with a handle(req, res, next) method. Don't add UploadImageMiddleware here:
// it would parse multipart bodies before postForm/putForm/patchForm routes can.
class MiddlewareProvider {
  /**
   * [Global middleware for all routes placed in the beginning before another middleware]
   *
   * @return  {[array]}  [array list of middleware]
   */
  beginning() {
    // sample
    // return [
    //   (req, res, next) => { res.set('X-Request-Start', String(Date.now())); next(); },
    // ];
  }

  /**
   * [Global middleware for all routes placed in the end after another middleware]
   *
   * @return  {[array]}  [array list of middleware]
   */
  end() {
    // sample
    // return [
    //   'SomeMiddleware', // app/Middleware/SomeMiddleware.js
    // ];
  }
}

export default new MiddlewareProvider();
