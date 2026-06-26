import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../utils/logger.js';

const router = express.Router();

// Ensure AWS Environment Variables are set (will log warning if not)
if (!process.env.AWS_REGION || !process.env.AWS_S3_BUCKET_NAME) {
  logger.warn('UploadRoutes', 'AWS_REGION or AWS_S3_BUCKET_NAME is not set. S3 uploads may fail.');
}

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_S3_BUCKET_NAME || 'my-apparel-bucket',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const uniqueSuffix = crypto.randomBytes(8).toString('hex');
      const ext = path.extname(file.originalname);
      cb(null, `uploads/${uniqueSuffix}${ext}`);
    }
  }),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB max WhatsApp broadcast limit
  fileFilter: (req, file, cb) => {
    const allowedPrefixes = ['image/', 'video/', 'audio/', 'application/pdf'];
    if (allowedPrefixes.some(prefix => file.mimetype.startsWith(prefix))) {
      cb(null, true);
    } else {
      cb(new Error('Security violation: Unsupported broadcast media type. Only images, audio, video, or PDFs are permitted.'));
    }
  }
});

router.post('/', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload rejection: ${err.message}` });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
}, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    logger.info('UploadRoutes', `File uploaded successfully: ${req.file.originalname} -> ${req.file.key}`);
    // multer-s3 automatically populates req.file.location with the public URL
    res.json({
      message: 'File uploaded successfully',
      url: req.file.location, // S3 Public URL
      filename: req.file.originalname,
      storedFilename: req.file.key // The S3 Key
    });
  } catch (err) {
    logger.error('UploadRoutes', 'Error handling file upload response', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
