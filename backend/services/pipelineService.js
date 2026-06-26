import prisma from '../prismaClient.js';
import { logger } from '../utils/logger.js';
import sendQueue from '../queues/sendQueue.js';

/**
 * Calculate the next scheduled execution time for a pipeline
 */
export function calculateNextRun(pipeline) {
  const now = new Date();
  
  if (pipeline.triggerType === 'INTERVAL' && pipeline.intervalMins > 0) {
    return new Date(now.getTime() + pipeline.intervalMins * 60 * 1000);
  } else if (pipeline.triggerType === 'DAILY_TIME' && pipeline.dailyTime) {
    const [hours, mins] = pipeline.dailyTime.split(':').map(Number);
    const nextDate = new Date();
    nextDate.setHours(hours, mins, 0, 0);
    
    // If today's time has already passed, schedule for tomorrow
    if (nextDate <= now) {
      nextDate.setDate(nextDate.getDate() + 1);
    }
    return nextDate;
  }
  
  // Default fallback: 1 hour
  return new Date(now.getTime() + 60 * 60 * 1000);
}

/**
 * Get all configured automation pipelines
 */
export async function getAllPipelines() {
  const pipelines = await prisma.pipeline.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  // Attach template details
  const results = [];
  for (const p of pipelines) {
    const template = await prisma.messageTemplate.findUnique({
      where: { id: p.templateId },
      select: { name: true }
    });
    results.push({
      ...p,
      templateName: template?.name || `Template #${p.templateId}`
    });
  }
  return results;
}

/**
 * Create a new automated campaign pipeline
 */
export async function createPipeline(data) {
  const { name, description, triggerType, intervalMins, dailyTime, targetStatus, templateId, batchSize, delayMs } = data;
  
  const tempPipeline = { triggerType, intervalMins: Number(intervalMins || 60), dailyTime };
  const nextRunAt = calculateNextRun(tempPipeline);

  const pipeline = await prisma.pipeline.create({
    data: {
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      triggerType: String(triggerType || 'INTERVAL'),
      intervalMins: intervalMins ? Number(intervalMins) : null,
      dailyTime: dailyTime || null,
      targetStatus: String(targetStatus || 'PENDING'),
      templateId: Number(templateId),
      batchSize: Number(batchSize || 50),
      delayMs: Number(delayMs || 2000),
      isActive: true,
      nextRunAt
    }
  });

  logger.info('PipelineService', `Created automated pipeline: ${pipeline.name} (Next Run: ${nextRunAt.toISOString()})`);
  return pipeline;
}

/**
 * Toggle Pipeline active state (Pause / Resume)
 */
export async function togglePipeline(id) {
  const existing = await prisma.pipeline.findUnique({ where: { id: Number(id) } });
  if (!existing) throw new Error('Pipeline not found');

  const updated = await prisma.pipeline.update({
    where: { id: existing.id },
    data: { 
      isActive: !existing.isActive,
      // If resuming, recalculate nextRunAt from now
      nextRunAt: !existing.isActive ? calculateNextRun(existing) : existing.nextRunAt
    }
  });

  logger.info('PipelineService', `Pipeline "${updated.name}" toggled to ${updated.isActive ? 'ACTIVE' : 'PAUSED'}`);
  return updated;
}

/**
 * Execute a pipeline batch dispatch immediately
 */
export async function dispatchPipelineBatch(pipeline) {
  try {
    // 1. Fetch matching contacts
    const whereClause = pipeline.targetStatus === 'ALL' ? {} : { status: pipeline.targetStatus };
    const matchingContacts = await prisma.contact.findMany({
      where: whereClause,
      take: pipeline.batchSize,
      select: { id: true }
    });

    if (matchingContacts.length === 0) {
      logger.info('PipelineEngine', `Pipeline "${pipeline.name}" triggered, but 0 contacts match status "${pipeline.targetStatus}".`);
      return { dispatched: 0 };
    }

    const contactIds = matchingContacts.map(c => c.id);

    // 2. Dispatch job to BullMQ queue
    const job = await sendQueue.add(`AutoPipeline-${pipeline.name}-${Date.now()}`, {
      templateId: pipeline.templateId,
      contactIds,
      delayMs: pipeline.delayMs,
      isTemplateMode: true,
      pipelineId: pipeline.id
    });

    // 3. Update pipeline metrics
    const nextRunAt = calculateNextRun(pipeline);
    await prisma.pipeline.update({
      where: { id: pipeline.id },
      data: {
        lastRunAt: new Date(),
        nextRunAt,
        totalRuns: { increment: 1 }
      }
    });

    logger.info('PipelineEngine', `[DISPATCHED] Pipeline "${pipeline.name}" dispatched batch of ${contactIds.length} contacts (Job ID: ${job.id})`);
    return { dispatched: contactIds.length, jobId: job.id };
  } catch (err) {
    logger.error('PipelineEngine', `Error dispatching pipeline "${pipeline?.name}"`, err);
    throw err;
  }
}

/**
 * Manually trigger pipeline execution override
 */
export async function triggerPipelineOverride(id) {
  const pipeline = await prisma.pipeline.findUnique({ where: { id: Number(id) } });
  if (!pipeline) throw new Error('Pipeline not found');
  return await dispatchPipelineBatch(pipeline);
}

/**
 * Delete a pipeline
 */
export async function deletePipeline(id) {
  const deleted = await prisma.pipeline.delete({ where: { id: Number(id) } });
  logger.info('PipelineService', `Deleted pipeline "${deleted.name}"`);
  return deleted;
}
