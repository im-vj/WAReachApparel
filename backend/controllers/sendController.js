import { v4 as uuidv4 } from 'uuid';
import prisma from '../prismaClient.js';
import { sendMessage } from '../services/whatsappService.js';

const clients = new Map();

export const streamProgress = (req, res) => {
  const { clientId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  res.write(`event: init\ndata: "Connected"\n\n`);
  
  clients.set(clientId, res);
  
  req.on('close', () => {
    clients.delete(clientId);
  });
};

const sendEvent = (clientId, eventName, data) => {
  const res = clients.get(clientId);
  if (res) {
    res.write(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`);
  }
};

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const startSending = async (req, res) => {
  const { templateId, contactIds, delayMs = 3000, isTemplateMode = false } = req.body;
  const clientId = uuidv4();
  
  res.json({ clientId, message: 'Sending started' });

  // Run bulk send asynchronously
  (async () => {
    try {
      const template = await prisma.messageTemplate.findUnique({ where: { id: Number(templateId) } });
      if (!template) {
        sendEvent(clientId, 'error', 'Template not found');
        return;
      }

      sendEvent(clientId, 'progress', { total: contactIds.length, sent: 0, failed: 0 });
      
      let sent = 0;
      let failed = 0;

      for (const contactId of contactIds) {
        const contact = await prisma.contact.findUnique({ where: { id: Number(contactId) } });
        if (!contact) continue;

        const renderedMessage = template.content.replace(/\{name\}/g, contact.displayName || '');
        
        sendEvent(clientId, 'status', {
          contactId: contact.id,
          name: contact.displayName,
          status: 'SENDING',
          message: `Sending to ${contact.displayName}...`
        });

        let waRes = await sendMessage(
          contact.phoneNumber,
          renderedMessage,
          isTemplateMode,
          template.metaTemplateName,
          contact.displayName
        );

        if (!waRes.success && waRes.isRateLimited) {
          sendEvent(clientId, 'status', {
            contactId: contact.id,
            name: contact.displayName,
            status: 'RATE_LIMITED',
            message: 'Rate limited. Waiting 60s...'
          });
          await sleep(60000);
          waRes = await sendMessage(
            contact.phoneNumber,
            renderedMessage,
            isTemplateMode,
            template.metaTemplateName,
            contact.displayName
          );
        }

        // Save SendLog
        await prisma.sendLog.create({
          data: {
            contactId: contact.id,
            templateId: template.id,
            renderedMessage,
            waMessageId: waRes.messageId,
            responseStatus: waRes.success ? 'SUCCESS' : 'FAILED',
            responseBody: waRes.fullResponse
          }
        });

        // Update Contact
        await prisma.contact.update({
          where: { id: contact.id },
          data: {
            status: waRes.success ? 'SENT' : 'FAILED',
            waMessageId: waRes.messageId || null,
            sentAt: waRes.success ? new Date() : null,
            errorMessage: waRes.success ? null : waRes.error
          }
        });

        if (waRes.success) {
          sent++;
          sendEvent(clientId, 'status', {
            contactId: contact.id,
            name: contact.displayName,
            status: 'SENT',
            message: `Sent (msg id: ${waRes.messageId})`
          });
        } else {
          failed++;
          sendEvent(clientId, 'status', {
            contactId: contact.id,
            name: contact.displayName,
            status: 'FAILED',
            message: `Failed: ${waRes.error}`
          });
        }

        sendEvent(clientId, 'progress', { total: contactIds.length, sent, failed });

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      sendEvent(clientId, 'complete', { total: contactIds.length, sent, failed });

    } catch (err) {
      console.error('Bulk send error:', err);
      sendEvent(clientId, 'error', err.message);
    }
  })();
};

export const sendTest = async (req, res) => {
  const { phone, message } = req.body;
  if (!phone) {
    return res.status(400).json({ error: 'Phone number is required' });
  }
  const waRes = await sendMessage(phone, message || 'Test message from WAReach', false, null, null);
  if (waRes.success) {
    res.json(waRes);
  } else {
    res.status(400).json(waRes);
  }
};
