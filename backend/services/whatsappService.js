import axios from 'axios';
import { getSettingsMap } from './settingsService.js';
import { logger } from '../utils/logger.js';

export const sendMessage = async (phoneNumber, message, isTemplateMode, templateName, templateVar, documentUrl, documentFilename) => {
  const response = { success: false, messageId: null, error: null, fullResponse: null, isRateLimited: false };
  
  try {
    const settings = await getSettingsMap();
    const phoneId = settings['whatsapp.phone-number-id'] || process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = settings['whatsapp.access-token'] || process.env.WHATSAPP_ACCESS_TOKEN;
    const apiVersion = settings['whatsapp.api-version'] || process.env.WHATSAPP_API_VERSION || 'v25.0';
    const langCode = settings['whatsapp.template-language'] || 'en';
    
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
      
      const components = [];
      if (documentUrl) {
        components.push({
          type: 'header',
          parameters: [{
            type: 'document',
            document: { 
              link: documentUrl,
              ...(documentFilename && { filename: documentFilename })
            }
          }]
        });
      }
      
      if (templateVar !== null && templateVar !== undefined && templateVar !== '') {
        components.push({
          type: 'body',
          parameters: [{ type: 'text', text: templateVar }]
        });
      }

      body.template = {
        name: templateName ? templateName.trim() : '',
        language: { code: langCode },
        components: components
      };
    } else {
      if (documentUrl) {
        body.type = 'document';
        body.document = { 
          link: documentUrl,
          caption: message,
          ...(documentFilename && { filename: documentFilename })
        };
      } else {
        body.type = 'text';
        body.text = { body: message, preview_url: true };
      }
    }

    logger.info('WhatsAppService', `Sending message to ${phoneNumber}: ${JSON.stringify(body)}`);

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
      logger.info('WhatsAppService', `Successfully sent message to ${phoneNumber} -> Msg ID: ${response.messageId}`);
    } else {
      response.error = 'Unknown success response format';
      logger.warn('WhatsAppService', `Unknown success response format for ${phoneNumber}: ${response.fullResponse}`);
    }
  } catch (error) {
    const errorMsg = error.response?.data?.error?.message || error.message;
    const errorDetails = error.response?.data || error.message;
    
    response.error = errorMsg;
    response.fullResponse = JSON.stringify(errorDetails);
    
    logger.error('WhatsAppService', `Failed sending message to ${phoneNumber}: ${errorMsg}`, error);
    
    if (response.error.includes('130429') || (error.response && error.response.status === 429)) {
      response.isRateLimited = true;
    }
  }

  return response;
};
