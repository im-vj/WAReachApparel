import prisma from '../prismaClient.js';
import { logger } from '../utils/logger.js';
import axios from 'axios';
import { getSettingsMap } from '../services/settingsService.js';

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

export const syncMetaTemplates = async (req, res) => {
  try {
    const settings = await getSettingsMap();
    const wabaId = settings['whatsapp.business-account-id'] || process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
    const accessToken = settings['whatsapp.access-token'] || process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = settings['whatsapp.api-version'] || process.env.WHATSAPP_API_VERSION || 'v25.0';

    if (!wabaId || !accessToken) {
      return res.status(400).json({ error: 'WhatsApp Business Account ID and Permanent Access Token must be configured in Settings.' });
    }

    logger.info('TemplateController', `Fetching templates from Meta WABA ${wabaId}`);
    const metaUrl = `https://graph.facebook.com/${apiVersion}/${wabaId}/message_templates`;
    const response = await axios.get(metaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const metaTemplates = response.data.data || [];
    let syncedCount = 0;

    for (const mt of metaTemplates) {
      if (mt.status !== 'APPROVED') continue;
      const metaName = mt.name;
      const bodyComponent = mt.components?.find(c => c.type === 'BODY' || c.type === 'body');
      const contentText = bodyComponent ? bodyComponent.text : `[Template ${metaName}]`;
      const displayName = metaName.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

      const existing = await prisma.messageTemplate.findFirst({
        where: {
          OR: [
            { metaTemplateName: metaName },
            { name: displayName }
          ]
        }
      });

      if (existing) {
        await prisma.messageTemplate.update({
          where: { id: existing.id },
          data: {
            content: contentText,
            metaTemplateName: metaName
          }
        });
      } else {
        await prisma.messageTemplate.create({
          data: {
            name: displayName,
            content: contentText,
            metaTemplateName: metaName
          }
        });
      }
      syncedCount++;
    }

    logger.info('TemplateController', `Successfully synced ${syncedCount} templates from Meta`);
    const all = await prisma.messageTemplate.findMany();
    res.json({ syncedCount, templates: all });
  } catch (error) {
    const errDetails = error.response?.data?.error?.message || error.message;
    logger.error('TemplateController', `Error syncing Meta templates: ${errDetails}`, error.response?.data || error);
    res.status(500).json({ error: `Failed to sync from Meta: ${errDetails}` });
  }
};
