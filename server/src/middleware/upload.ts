import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.join(UPLOADS_DIR, 'disciplines');
    ensureDir(dir);
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const hash = crypto.randomBytes(8).toString('hex');
    cb(null, `${Date.now()}-${hash}${ext}`);
  },
});

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
const MAX_SIZE = 2 * 1024 * 1024; // 2 MB

export const uploadLogo = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Допустимые форматы: JPEG, PNG, WebP, SVG, GIF'));
    }
  },
});
