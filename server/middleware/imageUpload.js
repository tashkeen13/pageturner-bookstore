import multer from 'multer';
import { ApiError } from './errorMiddleware.js';

const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(_req, file, callback) {
    if (!allowedTypes.has(file.mimetype)) {
      callback(new ApiError(400, 'Cover image must be a JPEG, PNG, or WebP file.'));
      return;
    }
    callback(null, true);
  }
});

export default imageUpload;
