import prisma from '../prismaClient.js';

export const getSettingsMap = async () => {
  const settingsArray = await prisma.appSetting.findMany();
  const settings = {};
  for (const s of settingsArray) {
    settings[s.key] = s.value;
  }
  return settings;
};

export const initSettings = async () => {
  const DEFAULT_KEYS = [
    'whatsapp.phone-number-id',
    'whatsapp.business-account-id',
    'whatsapp.access-token',
    'whatsapp.api-version',
    'whatsapp.template-language',
    'auth.admin-email',
    'auth.admin-password'
  ];

  for (const key of DEFAULT_KEYS) {
    const exists = await prisma.appSetting.findUnique({ where: { key } });
    if (!exists) {
      let defaultValue = '';
      if (key === 'whatsapp.api-version') defaultValue = process.env.WHATSAPP_API_VERSION || 'v25.0';
      if (key === 'whatsapp.template-language') defaultValue = 'en';
      if (key === 'whatsapp.phone-number-id') defaultValue = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
      if (key === 'whatsapp.business-account-id') defaultValue = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '';
      if (key === 'whatsapp.access-token') defaultValue = process.env.WHATSAPP_ACCESS_TOKEN || '';
      if (key === 'auth.admin-email') defaultValue = process.env.ADMIN_EMAIL || '';
      if (key === 'auth.admin-password') defaultValue = process.env.ADMIN_PASSWORD || '';

      await prisma.appSetting.create({
        data: {
          key,
          value: defaultValue
        }
      });
    }
  }
};
