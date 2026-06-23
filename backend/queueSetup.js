import Redis from 'ioredis';
import { Queue, QueueEvents } from 'bullmq';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null
});

redisConnection.on('error', (err) => {
  console.error('Redis connection error:', err.message);
});

export const sendQueue = new Queue('SendMessages', { connection: redisConnection });
export const sendQueueEvents = new QueueEvents('SendMessages', { connection: redisConnection });

export default redisConnection;
