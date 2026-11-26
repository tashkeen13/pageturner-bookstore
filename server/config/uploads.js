import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function getUploadsDirectory() {
  const configuredDirectory = process.env.UPLOAD_DIR || 'uploads';
  return path.isAbsolute(configuredDirectory)
    ? configuredDirectory
    : path.resolve(serverDirectory, configuredDirectory);
}
