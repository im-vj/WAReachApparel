import express from 'express';
import * as pipelineController from '../controllers/pipelineController.js';

const router = express.Router();

router.get('/', pipelineController.getAll);
router.post('/', pipelineController.create);
router.put('/:id', pipelineController.update);
router.put('/:id/toggle', pipelineController.toggle);
router.post('/:id/trigger', pipelineController.trigger);
router.delete('/:id', pipelineController.remove);

export default router;
