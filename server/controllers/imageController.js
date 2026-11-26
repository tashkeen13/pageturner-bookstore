import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getUploadsDirectory } from '../config/uploads.js';
import { ApiError } from '../middleware/errorMiddleware.js';

function hasValidImageSignature(file) {
  const bytes = file.buffer;
  if (file.mimetype === 'image/jpeg') {
    return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (file.mimetype === 'image/png') {
    return bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  }
  if (file.mimetype === 'image/webp') {
    return bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  }
  return false;
}

export async function uploadBookCover(req, res) {
  if (!req.file) throw new ApiError(400, 'Choose a cover image to upload.');
  if (!hasValidImageSignature(req.file)) {
    throw new ApiError(400, 'The uploaded file does not match its declared image format.');
  }
  const extensions = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
  const filename = `${randomUUID()}${extensions[req.file.mimetype]}`;
  const uploadDirectory = getUploadsDirectory();
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, filename), req.file.buffer, { flag: 'wx', mode: 0o644 });

  res.status(201).json({
    success: true,
    image: {
      url: `/uploads/${filename}`
    }
  });
}
