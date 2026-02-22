import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadLogo, uploadImage } from '../middleware/upload';
import { isS3Enabled, uploadFile, deleteFile } from '../s3';

const router = Router();

async function handleUpload(
  req: Express.Request & { file?: Express.Multer.File },
  folder: string,
  localPrefix: string,
): Promise<string> {
  if (!req.file) throw new Error('Файл не загружен');

  if (isS3Enabled()) {
    return uploadFile(req.file.buffer, req.file.originalname, req.file.mimetype, folder);
  }

  return `${localPrefix}${req.file.filename}`;
}

async function handleDelete(url: string, localPrefix: string): Promise<void> {
  if (isS3Enabled()) {
    await deleteFile(url);
    return;
  }

  if (!url.startsWith(localPrefix)) throw new Error('Некорректный путь файла');
  const filePath = path.join(process.cwd(), url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
}

router.post('/discipline-logo', uploadLogo.single('logo'), async (req, res, next) => {
  try {
    const url = await handleUpload(req, 'disciplines', '/uploads/disciplines/');
    res.json({ url });
  } catch (err) {
    if (err instanceof Error && err.message === 'Файл не загружен') {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete('/discipline-logo', async (req, res, next) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url) { res.status(400).json({ error: 'Некорректный путь файла' }); return; }
    await handleDelete(url, '/uploads/disciplines/');
    res.json({ message: 'Файл удалён' });
  } catch (err) {
    next(err);
  }
});

router.post('/image', uploadImage.single('image'), async (req, res, next) => {
  try {
    const url = await handleUpload(req, 'images', '/uploads/images/');
    res.json({ url });
  } catch (err) {
    if (err instanceof Error && err.message === 'Файл не загружен') {
      res.status(400).json({ error: err.message });
      return;
    }
    next(err);
  }
});

router.delete('/image', async (req, res, next) => {
  try {
    const { url } = req.body as { url?: string };
    if (!url) { res.status(400).json({ error: 'Некорректный путь файла' }); return; }
    await handleDelete(url, '/uploads/images/');
    res.json({ message: 'Файл удалён' });
  } catch (err) {
    next(err);
  }
});

export default router;
