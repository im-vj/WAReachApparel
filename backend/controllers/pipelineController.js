import * as pipelineService from '../services/pipelineService.js';
import { logger } from '../utils/logger.js';

export const getAll = async (req, res) => {
  try {
    const data = await pipelineService.getAllPipelines();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const create = async (req, res) => {
  try {
    const { name, templateId } = req.body;
    if (!name || !templateId) {
      return res.status(400).json({ error: 'Pipeline Name and Target Template are required.' });
    }
    const created = await pipelineService.createPipeline(req.body);
    res.status(201).json(created);
  } catch (err) {
    logger.error('PipelineController', 'Creation error', err);
    res.status(400).json({ error: err.message || 'Failed to create automation loop' });
  }
};

export const update = async (req, res) => {
  try {
    const { name, templateId } = req.body;
    if (!name || !templateId) {
      return res.status(400).json({ error: 'Pipeline Name and Target Template are required.' });
    }
    const updated = await pipelineService.updatePipeline(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    logger.error('PipelineController', 'Update error', err);
    res.status(400).json({ error: err.message || 'Failed to update automation loop' });
  }
};

export const toggle = async (req, res) => {
  try {
    const updated = await pipelineService.togglePipeline(req.params.id);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const trigger = async (req, res) => {
  try {
    const result = await pipelineService.triggerPipelineOverride(req.params.id);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const remove = async (req, res) => {
  try {
    await pipelineService.deletePipeline(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
