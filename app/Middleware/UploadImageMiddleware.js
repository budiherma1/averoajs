import multer from 'multer';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const MAX_FILE_SIZE = Number(process.env.UPLOAD_MAX_FILE_SIZE) || 2 * 1024 * 1024; // bytes

/**
 * Accepts one image in a multipart field (default `image`) and leaves it in
 * memory; UploadProvider writes it (and sanitizes the name and path).
 *
 * The file is exposed twice:
 * - `req.file` for custom controllers (`UploadProvider.upload(req.file, 'avatars')`);
 * - `req.files = [req.file]`, which crud routes read: `validationRouter` moves it to
 *   `req.dataFiles` when the model has a column of the same name flagged
 *   `upload: true`, and `Crud.create` / `Crud.update` store it.
 *
 * Use it on plain post/put/patch routes. `postForm`/`putForm`/`patchForm` routes parse
 * the multipart body themselves, after every middleware, so don't combine the two.
 *
 *   router.post('/', 'PostController@create', ['UploadImageMiddleware']);  // field `image`
 *   router.post('/', 'PostController@create', [new UploadImageMiddleware('photo')]);
 */
export class UploadImageMiddleware {
  constructor(field = 'image') {
    this.field = field;
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE, files: 1 },
      fileFilter: (req, file, cb) => {
        if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);
        const err = new Error(`only ${ALLOWED_MIME_TYPES.join(', ')} are allowed`);
        err.code = 'INVALID_FILE_TYPE';
        return cb(err);
      },
    }).single(field);
  }

  handle(req, res, next) {
    this.upload(req, res, (err) => {
      if (!err) {
        if (req.file) req.files = [req.file];
        return next();
      }
      const column = this.field;
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ status: false, data: { column, message: `file is larger than ${MAX_FILE_SIZE} bytes` } });
      }
      if (err.code === 'INVALID_FILE_TYPE' || err instanceof multer.MulterError) {
        return res.status(422).json({ status: false, data: { column, message: err.message } });
      }
      // malformed multipart body (busboy parse error)
      if (err.status === undefined && err.statusCode === undefined) {
        err.status = 400;
        err.expose = true;
      }
      return next(err);
    });
  }
}

export default new UploadImageMiddleware();
