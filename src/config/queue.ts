import Queue from 'bull';
import dotenv from 'dotenv';

dotenv.config();

const redisOptions = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
};

const videoProcessingQueue = new Queue('video-processing', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

const trimQueue = new Queue('video-trim', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

const subtitleQueue = new Queue('video-subtitle', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

const renderQueue = new Queue('video-render', {
  redis: redisOptions,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 10000
    },
    removeOnComplete: true,
    removeOnFail: false
  }
});

[videoProcessingQueue, trimQueue, subtitleQueue, renderQueue].forEach(queue => {
  queue.on('error', (error) => {
    console.error(`Queue ${queue.name} error:`, error);
  });

  queue.on('failed', (job, error) => {
    console.error(`Job ${job.id} in queue ${queue.name} failed:`, error);
  });
});

export {
  videoProcessingQueue,
  trimQueue,
  subtitleQueue,
  renderQueue
};
