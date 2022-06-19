import multer from 'multer';

class UploadImagesMiddleware {
	handle(req, res, next) {
		const upload = multer({ dest: './storages/upload/' })
		upload.array('images', 20)(req, res, next);
	}
}

export default new UploadImagesMiddleware