import express from 'express';
import multer from 'multer';
import path from 'path';
import * as contactController from '../controllers/contactController.js';

const router = express.Router();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedExts = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: Only Excel (.xlsx, .xls) or CSV documents are permitted.'));
    }
  }
});

router.get('/', contactController.getAllContacts);
router.post('/import', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `File upload error: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, contactController.importContacts);
router.delete('/:id', contactController.deleteContact);
router.post('/reset', contactController.resetContacts);

export default router;
