import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../middleware/authenticate';
import { requireAdmin } from '../../middleware/requireAdmin';
import * as controller from './media.controller';

// Store files in memory — never write to disk on the server
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB max
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'application/pdf',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg',
      'video/mp4', 'video/quicktime',
      'application/zip', 'application/x-zip-compressed',
      'text/plain',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed`));
    }
  },
});

const router = Router();

router.get('/', authenticate, requireAdmin, controller.listMedia);
router.post('/upload', authenticate, requireAdmin, upload.single('file'), controller.uploadMedia);
router.delete('/:id', authenticate, requireAdmin, controller.deleteMedia);

export default router;
