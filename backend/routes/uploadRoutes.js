import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';

const router = express.Router();

// Configure storage for Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    // Generate a unique filename to prevent overwrites
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage: storage });

router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  // Construct the URL to access the uploaded file
  // Using x-forwarded-proto and x-forwarded-host if behind a proxy
  const protocol = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.get('host');
  const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

  res.json({
    message: 'File uploaded successfully',
    url: fileUrl,
    filename: req.file.originalname,
    storedFilename: req.file.filename
  });
});

export default router;
