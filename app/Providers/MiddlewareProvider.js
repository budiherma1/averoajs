// import UploadImagesMiddleware from "../Middleware/UploadImagesMiddleware.js";
class MiddlewareProvider {
  /**
   * [Global middleware for all routes placed in the beginning before another middleware]
   *
   * @return  {[array]}  [array list of middleware]
   */
  beginning() {
    // sample
    // return [
    // UploadImagesMiddleware,
    // ]
  }

  /**
   * [Global middleware for all routes placed in the end after another middleware]
   *
   * @return  {[array]}  [array list of middleware]
   */
  end() {
    // sample
    // return [
    // UploadImagesMiddleware,
    // ]
  }
}

export default new MiddlewareProvider;
