import Redis from 'ioredis';
import { Queue, QueueEvents } from 'bullmq';

const redisConnection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

export const sendQueue = new Queue('SendMessages', { connection: redisConnection });
export const sendQueueEvents = new QueueEvents('SendMessages', { connection: redisConnection });

export default redisConnection;
