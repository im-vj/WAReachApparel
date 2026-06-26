import prisma from '../prismaClient.js';
import { logger } from '../utils/logger.js';

export const getAllTemplates = async (req, res) => {
  try {
    const templates = await prisma.messageTemplate.findMany();
    res.json(templates);
  } catch (error) {
    logger.error('TemplateController', 'Error fetching templates', error);
    res.status(500).json({ error: error.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await prisma.messageTemplate.create({
      data: req.body
    });
    logger.info('TemplateController', `Created template ${template.id}`);
    res.json(template);
  } catch (error) {
    logger.error('TemplateController', 'Error creating template', error);
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await prisma.messageTemplate.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    logger.info('TemplateController', `Updated template ${template.id}`);
    res.json(template);
  } catch (error) {
    logger.error('TemplateController', `Error updating template ${req.params.id}`, error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await prisma.sendLog.deleteMany({ where: { templateId: Number(req.params.id) } });
    await prisma.messageTemplate.delete({ where: { id: Number(req.params.id) } });
    logger.info('TemplateController', `Deleted template ${req.params.id}`);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    logger.error('TemplateController', `Error deleting template ${req.params.id}`, error);
    res.status(500).json({ error: error.message });
  }
};
