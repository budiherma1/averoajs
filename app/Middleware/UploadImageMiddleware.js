import multer from 'multer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_FILE_SIZE) || 2 * 1024 * 1024; // bytes

// kept in memory, then written by UploadProvider (which sanitizes the name and path)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
    const err = new Error(`only ${ALLOWED_MIME_TYPES.join(', ')} are allowed`);
    err.code = 'INVALID_FILE_TYPE';
    return cb(err);
  },
}).single('image');

class UploadImageMiddleware {
  handle(req, res, next) {
    upload(req, res, (err) => {
      if (!err) return next();
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ status: false, data: { column: 'image', message: `file is larger than ${MAX_FILE_SIZE} bytes` } });
      }
      if (err.code === 'INVALID_FILE_TYPE' || err instanceof multer.MulterError) {
        return res.status(422).json({ status: false, data: { column: 'image', message: err.message } });
      }
      return next(err);
    });
  }
}

export default new UploadImageMiddleware();
