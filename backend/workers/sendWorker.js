import { Worker } from 'bullmq';
import redisConnection from '../queueSetup.js';
import prisma from '../prismaClient.js';
import { sendMessage } from '../services/whatsappService.js';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendWorker = new Worker('SendMessages', async (job) => {
  const { templateId, contactIds, delayMs, isTemplateMode } = job.data;
  const template = await prisma.messageTemplate.findUnique({ where: { id: Number(templateId) } });
  
  if (!template) {
    throw new Error('Template not found');
  }

  let sent = 0;
  let failed = 0;
  const total = contactIds.length;
  logger.info('SendWorker', `Starting job ${job.id}: processing ${total} contacts (Template ID: ${templateId})`);

  for (let i = 0; i < total; i++) {
    const contactId = contactIds[i];
    const contact = await prisma.contact.findUnique({ where: { id: Number(contactId) } });
    if (!contact) continue;

    const formatName = (name) => {
      if (!name) return '';
      return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
    };
    
    const formattedName = formatName(contact.displayName);
    const renderedMessage = template.content.replace(/\{name\}/g, formattedName);
    const hasNameParam = /\{name\}|\{\{\d+\}\}/i.test(template.content || '');
    
    await job.updateProgress({
      total, sent, failed,
      current: { contactId: contact.id, name: contact.displayName, status: 'SENDING', message: `Sending to ${contact.displayName}...` }
    });

    let finalDocumentUrl = template.headerDocumentUrl;
    
    // Check if it's an internal S3 Key (not starting with http)
    if (finalDocumentUrl && !finalDocumentUrl.startsWith('http')) {
      const s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
        }
      });
      
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME || 'my-apparel-bucket',
        Key: finalDocumentUrl
      });
      
      try {
        // Generate a URL valid for 1 hour
        finalDocumentUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
      } catch (err) {
        logger.error('SendWorker', 'Failed to generate presigned URL', err);
      }
    }

    let waRes = await sendMessage(
      contact.phoneNumber,
      renderedMessage,
      isTemplateMode,
      template.metaTemplateName,
      hasNameParam ? formattedName : null,
      finalDocumentUrl,
      template.headerDocumentFilename
    );

    if (!waRes.success && waRes.isRateLimited) {
      await job.updateProgress({
        total, sent, failed,
        current: { contactId: contact.id, name: contact.displayName, status: 'RATE_LIMITED', message: 'Rate limited. Waiting 60s...' }
      });
      await sleep(60000);
      waRes = await sendMessage(
        contact.phoneNumber,
        renderedMessage,
        isTemplateMode,
        template.metaTemplateName,
        hasNameParam ? formattedName : null,
        finalDocumentUrl,
        template.headerDocumentFilename
      );
    }

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
      logger.info('SendWorker', `Job ${job.id}: [SENT] ${contact.displayName} (${contact.phoneNumber}) -> Msg ID: ${waRes.messageId}`);
      await job.updateProgress({
        total, sent, failed,
        current: { contactId: contact.id, name: contact.displayName, status: 'SENT', message: `Sent (msg id: ${waRes.messageId})` }
      });
    } else {
      failed++;
      logger.warn('SendWorker', `Job ${job.id}: [FAILED] ${contact.displayName} (${contact.phoneNumber}) -> Reason: ${waRes.error}`);
      await job.updateProgress({
        total, sent, failed,
        current: { contactId: contact.id, name: contact.displayName, status: 'FAILED', message: `Failed: ${waRes.error}` }
      });
    }

    if (delayMs > 0 && i < total - 1) {
      await sleep(delayMs);
    }
  }

  return { total, sent, failed };
}, { connection: redisConnection, concurrency: 1 });

sendWorker.on('completed', job => {
  const { total = 0, sent = 0, failed = 0 } = job.returnvalue || {};
  logger.info('SendWorker', `Job ${job.id} finished. Summary -> Total: ${total}, Sent: ${sent}, Failed: ${failed}`);
});

sendWorker.on('failed', (job, err) => {
  logger.error('SendWorker', `Job ${job?.id} failed with exception`, err);
});

export default sendWorker;
