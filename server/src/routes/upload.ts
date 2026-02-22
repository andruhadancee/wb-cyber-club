import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { uploadLogo } from '../middleware/upload';

const router = Router();

router.post('/discipline-logo', uploadLogo.single('logo'), (req, res) => {
  if (!req.file) {
    res.status(400).json({ error: 'Файл не загружен' });
    return;
  }

  const url = `/uploads/disciplines/${req.file.filename}`;
  res.json({ url });
});

router.delete('/discipline-logo', (req, res) => {
  const { url } = req.body as { url?: string };
  if (!url || !url.startsWith('/uploads/disciplines/')) {
    res.status(400).json({ error: 'Некорректный путь файла' });
    return;
  }

  const filePath = path.join(process.cwd(), url);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  res.json({ message: 'Файл удалён' });
});

export default router;
