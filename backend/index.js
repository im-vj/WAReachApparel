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

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

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
