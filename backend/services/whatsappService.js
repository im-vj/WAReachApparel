import axios from 'axios';
import { getSettingsMap } from './settingsService.js';

export const sendMessage = async (phoneNumber, message, isTemplateMode, templateName, templateVar) => {
  const response = { success: false, messageId: null, error: null, fullResponse: null, isRateLimited: false };
  
  try {
    const settings = await getSettingsMap();
    const phoneId = settings['whatsapp.phone-number-id'] || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = settings['whatsapp.access-token'] || process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = settings['whatsapp.api-version'] || process.env.WHATSAPP_API_VERSION || 'v25.0';
    
    if (!phoneId || !accessToken) {
      throw new Error('WhatsApp API credentials are not configured in settings.');
    }

    const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;

    const body = {
      messaging_product: 'whatsapp',
      to: phoneNumber
    };

    if (isTemplateMode) {
      body.type = 'template';
      body.template = {
        name: templateName,
        language: { code: 'en' },
        components: [{
          type: 'body',
          parameters: [{ type: 'text', text: templateVar || '' }]
        }]
      };
    } else {
      body.type = 'text';
      body.text = { body: message, preview_url: true };
    }

    console.log(`Sending message to ${phoneNumber}:`, JSON.stringify(body));

    const res = await axios.post(url, body, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    response.fullResponse = JSON.stringify(res.data);
    if (res.data.messages && res.data.messages.length > 0) {
      response.success = true;
      response.messageId = res.data.messages[0].id;
    } else {
      response.error = 'Unknown success response format';
    }
  } catch (error) {
    response.error = error.response?.data?.error?.message || error.message;
    response.fullResponse = JSON.stringify(error.response?.data || error.message);
    
    if (response.error.includes('130429') || (error.response && error.response.status === 429)) {
      response.isRateLimited = true;
    }
  }

  return response;
};
