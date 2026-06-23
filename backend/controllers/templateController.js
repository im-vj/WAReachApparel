import prisma from '../prismaClient.js';

export const getAllTemplates = async (req, res) => {
  try {
    const templates = await prisma.messageTemplate.findMany();
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTemplate = async (req, res) => {
  try {
    const template = await prisma.messageTemplate.create({
      data: req.body
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await prisma.messageTemplate.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await prisma.sendLog.deleteMany({ where: { templateId: Number(req.params.id) } });
    await prisma.messageTemplate.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
