const multer  = require('multer')

class UploadImageMiddleware {
	handle(req, res, next) {
		const upload = multer({ dest: './storages/tmp/' })
		upload.single('image')(req, res, next);
	}
}

module.exports = new UploadImageMiddleware