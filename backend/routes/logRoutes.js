import express from 'express';
import * as logController from '../controllers/logController.js';

const router = express.Router();

router.get('/all', logController.getAllLogs);
router.get('/status', logController.getStatusCounts);

export default router;
