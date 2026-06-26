import express from 'express';
import * as templateController from '../controllers/templateController.js';

const router = express.Router();

router.get('/', templateController.getAllTemplates);
router.post('/sync', templateController.syncMetaTemplates);
router.post('/', templateController.createTemplate);
router.put('/:id', templateController.updateTemplate);
router.delete('/:id', templateController.deleteTemplate);

export default router;
