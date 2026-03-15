import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { JOB_QUEUE_NAMES } from '@ai-animation-factory/shared';

const redis = new Redis({
  host: 'localhost',
  port: 6380,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

async function test() {
  const queue = new Queue(JOB_QUEUE_NAMES.IDEA, { connection: redis });
  const job = await queue.add('test', { topic: 'AI' });
  console.log('Job added:', job.id);
  await queue.close();
  process.exit(0);
}

test();



