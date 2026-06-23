import express from 'express';
import * as sendController from '../controllers/sendController.js';

const router = express.Router();

router.post('/', sendController.startSending);
router.get('/progress/:clientId', sendController.streamProgress);
router.post('/test', sendController.sendTest);

export default router;
