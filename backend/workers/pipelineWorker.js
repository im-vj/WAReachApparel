import prisma from '../prismaClient.js';
import { dispatchPipelineBatch } from '../services/pipelineService.js';
import { logger } from '../utils/logger.js';

const POLL_INTERVAL_MS = 30 * 1000; // 30 seconds

let isRunning = false;

/**
 * Polling daemon loop verifying scheduled pipeline triggers
 */
async function tick() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date();
    // Find active pipelines where scheduled execution time has arrived
    const duePipelines = await prisma.pipeline.findMany({
      where: {
        isActive: true,
        nextRunAt: { lte: now }
      }
    });

    for (const pipeline of duePipelines) {
      logger.info('PipelineDaemon', `Executing scheduled trigger for automation "${pipeline.name}"...`);
      try {
        await dispatchPipelineBatch(pipeline);
      } catch (err) {
        logger.error('PipelineDaemon', `Exception during execution of "${pipeline.name}"`, err);
      }
    }
  } catch (error) {
    logger.error('PipelineDaemon', 'Daemon loop failure', error);
  } finally {
    isRunning = false;
  }
}

export function startPipelineDaemon() {
  logger.info('PipelineDaemon', `Automation engine initialized. Monitoring schedules every ${POLL_INTERVAL_MS / 1000}s.`);
  setInterval(tick, POLL_INTERVAL_MS);
}
