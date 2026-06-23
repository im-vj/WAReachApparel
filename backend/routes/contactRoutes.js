import express from 'express';
import multer from 'multer';
import * as contactController from '../controllers/contactController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', contactController.getAllContacts);
router.post('/import', upload.single('file'), contactController.importContacts);
router.delete('/:id', contactController.deleteContact);
router.post('/reset', contactController.resetContacts);

export default router;
