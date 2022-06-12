const multer  = require('multer')

class UploadImagesMiddleware {
	handle(req, res, next) {
		const upload = multer({ dest: './storages/tmp/' })
		upload.array('images', 20)(req, res, next);
	}
}

module.exports = new UploadImagesMiddleware