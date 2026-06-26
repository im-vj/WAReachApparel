import prisma from '../prismaClient.js';
import { getSettingsMap } from '../services/settingsService.js';
import { logger } from '../utils/logger.js';

export const getSettings = async (req, res) => {
  try {
    const settings = await getSettingsMap();
    // Security: Never transmit plaintext password over HTTP API
    if (settings['auth.admin-password']) {
      settings['auth.admin-password'] = '********';
    }
    res.json(settings);
  } catch (error) {
    logger.error('SettingsController', 'Error fetching settings', error);
    res.status(500).json({ error: error.message });
  }
};

export const saveSettings = async (req, res) => {
  try {
    const settings = req.body;
    for (const [key, value] of Object.entries(settings)) {
      // Security: Skip saving if sentinel mask string was unchanged
      if (key === 'auth.admin-password' && (value === '********' || value === '••••••••' || !value)) {
        continue;
      }
      await prisma.appSetting.upsert({
        where: { key },
        update: { value },
        create: { key, value }
      });
    }
    logger.info('SettingsController', 'Settings saved successfully');
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    logger.error('SettingsController', 'Error saving settings', error);
    res.status(500).json({ error: error.message });
  }
};
