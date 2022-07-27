// import UploadImagesMiddleware from "../Middleware/UploadImagesMiddleware.js";
class MiddlewareProvider {
  // Global middleware for all routes placed in the beginning before another middleware
  beginning() {
    // sample
    // return [
    // UploadImagesMiddleware,
    // ]
  }

  // Global middleware for all routes placed in the end after another middleware
  end() {
    // sample
    // return [
    // UploadImagesMiddleware,
    // ]
  }
}

export default new MiddlewareProvider;
