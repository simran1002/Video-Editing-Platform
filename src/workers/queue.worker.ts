import { videoProcessingQueue, trimQueue, subtitleQueue, renderQueue } from '../config/queue';
import { processVideo, processTrim, processSubtitle, processRender } from '../processors/video.processor';

export const startQueueWorkers = (): void => {
  videoProcessingQueue.process(async (job) => {
    console.log(`Processing video job ${job.id}`);
    await processVideo(job);
  });

  trimQueue.process(async (job) => {
    console.log(`Processing trim job ${job.id}`);
    await processTrim(job);
  });

  subtitleQueue.process(async (job) => {
    console.log(`Processing subtitle job ${job.id}`);
    await processSubtitle(job);
  });

  renderQueue.process(async (job) => {
    console.log(`Processing render job ${job.id}`);
    await processRender(job);
  });

  console.log('Queue workers started successfully');
};

export const setupQueueMonitoring = (): void => {
  [videoProcessingQueue, trimQueue, subtitleQueue, renderQueue].forEach(queue => {
    queue.on('completed', (job) => {
      console.log(`Job ${job.id} in queue ${queue.name} completed successfully`);
    });

    queue.on('failed', (job, error) => {
      console.error(`Job ${job.id} in queue ${queue.name} failed:`, error);
    });

    queue.on('stalled', (job) => {
      console.warn(`Job ${job.id} in queue ${queue.name} stalled`);
    });
  });
};
