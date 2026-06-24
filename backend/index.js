import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import contactRoutes from './routes/contactRoutes.js';
import templateRoutes from './routes/templateRoutes.js';
import sendRoutes from './routes/sendRoutes.js';
import logRoutes from './routes/logRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import { initSettings } from './services/settingsService.js';
import { initTemplates } from './services/templateService.js';
import './workers/sendWorker.js';
import uploadRoutes from './routes/uploadRoutes.js';

import path from 'path';
import { fileURLToPath } from 'url';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const PORT = process.env.PORT || 8080;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Basic rate limiting to prevent brute-force and DDoS
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', apiLimiter);

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api/contacts', contactRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/send', sendRoutes);
app.use('/api/log', logRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);

// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// Initialize DB defaults
const init = async () => {
  try {
    await initSettings();
    await initTemplates();
    console.log('Database defaults initialized.');
  } catch (err) {
    console.error('Failed to initialize database defaults:', err);
  }
};

app.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server is running on port ${PORT}`);
  await init();
});
