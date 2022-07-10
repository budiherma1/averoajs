import UploadImagesMiddleware from "../Middleware/UploadImagesMiddleware.js";
import ErrorMiddleware from "../Middleware/ErrorMiddleware.js";
class MiddlewareProvider {
	beginning() {
		console.log('MiddlewareProvider beginning')
		return [
			UploadImagesMiddleware,
		]
	}

	end() {
		console.log('MiddlewareProvider end')
		return [
		]
	}
}

export default new MiddlewareProvider;