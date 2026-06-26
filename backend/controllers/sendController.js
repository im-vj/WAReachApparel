import crypto from 'crypto';
import prisma from '../prismaClient.js';
import { sendMessage } from '../services/whatsappService.js';
import { sendQueue, sendQueueEvents } from '../queueSetup.js';
import { logger } from '../utils/logger.js';

export const streamProgress = async (req, res) => {
  const { clientId } = req.params;
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();
  
  res.write(`event: init\ndata: "Connected"\n\n`);

  const onProgress = ({ jobId, data }) => {
    if (jobId === clientId) {
      if (typeof data === 'object') {
        res.write(`event: progress\ndata: ${JSON.stringify({ total: data.total, sent: data.sent, failed: data.failed })}\n\n`);
        if (data.current) {
          res.write(`event: status\ndata: ${JSON.stringify(data.current)}\n\n`);
        }
      }
    }
  };

  const onCompleted = ({ jobId, returnvalue }) => {
    if (jobId === clientId) {
      res.write(`event: complete\ndata: ${JSON.stringify(returnvalue || {})}\n\n`);
    }
  };

  const onFailed = ({ jobId, failedReason }) => {
    if (jobId === clientId) {
      res.write(`event: error\ndata: ${JSON.stringify(failedReason)}\n\n`);
    }
  };

  sendQueueEvents.on('progress', onProgress);
  sendQueueEvents.on('completed', onCompleted);
  sendQueueEvents.on('failed', onFailed);
  
  req.on('close', () => {
    sendQueueEvents.off('progress', onProgress);
    sendQueueEvents.off('completed', onCompleted);
    sendQueueEvents.off('failed', onFailed);
  });
};

export const startSending = async (req, res) => {
  const { templateId, contactIds, delayMs = 3000, isTemplateMode = false } = req.body;
  const clientId = crypto.randomUUID();
  
  try {
    logger.info('SendController', `Queuing bulkSend job ${clientId} for ${contactIds?.length} contacts`);
    await sendQueue.add('bulkSend', {
      templateId,
      contactIds,
      delayMs,
      isTemplateMode
    }, { jobId: clientId });

    res.json({ clientId, message: 'Sending started' });
  } catch (err) {
    logger.error('SendController', 'Error starting bulk send job', err);
    res.status(500).json({ error: err.message });
  }
};

export const sendTest = async (req, res) => {
  try {
    const { phone, message } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }
    logger.info('SendController', `Sending test message to ${phone}`);
    const waRes = await sendMessage(phone, message || 'Test message from WAReach', false, null, null);
    if (waRes.success) {
      res.json(waRes);
    } else {
      logger.warn('SendController', `Test message failed to ${phone}: ${waRes.error}`);
      res.status(400).json(waRes);
    }
  } catch (err) {
    logger.error('SendController', 'Exception in sendTest', err);
    res.status(500).json({ error: err.message });
  }
};
