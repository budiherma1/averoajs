import multer from 'multer';

class UploadImageMiddleware {
  handle(req, res, next) {
    const upload = multer({ dest: './storages/upload/' });
    upload.single('image')(req, res, next);
  }
}

export default new UploadImageMiddleware;
