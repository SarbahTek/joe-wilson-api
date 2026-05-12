import { Worker } from 'bullmq';
import { redis } from '../config/redis';
import { sendEmail } from '../utils/email';

// Uses the shared Redis instance from config/redis.ts.
// Previously this was hardcoded to localhost:6379 which silently fails in production.
const emailWorker = new Worker(
  'emailQueue',

  async (job) => {
    const { to, subject, html } = job.data as { to: string; subject: string; html: string };

    if (!to || !subject || !html) {
      throw new Error(`Email job ${job.id} missing required fields: to, subject, html`);
    }

    await sendEmail(to, subject, html);
  },

  {
    connection: redis,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  console.log(`[EmailWorker] Job ${job.id} completed — sent to ${job.data.to}`);
});

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed:`, err.message);
});

emailWorker.on('error', (err) => {
  console.error('[EmailWorker] Worker error:', err.message);
});

export default emailWorker;
