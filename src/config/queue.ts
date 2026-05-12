import { Queue, Worker } from 'bullmq';

import { redis } from './redis';

export const connection = redis;

export { Queue, Worker };