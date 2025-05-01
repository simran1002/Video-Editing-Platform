"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderQueue = exports.subtitleQueue = exports.trimQueue = exports.videoProcessingQueue = void 0;
const bull_1 = __importDefault(require("bull"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const redisOptions = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};
const videoProcessingQueue = new bull_1.default('video-processing', {
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
exports.videoProcessingQueue = videoProcessingQueue;
const trimQueue = new bull_1.default('video-trim', {
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
exports.trimQueue = trimQueue;
const subtitleQueue = new bull_1.default('video-subtitle', {
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
exports.subtitleQueue = subtitleQueue;
const renderQueue = new bull_1.default('video-render', {
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
exports.renderQueue = renderQueue;
[videoProcessingQueue, trimQueue, subtitleQueue, renderQueue].forEach(queue => {
    queue.on('error', (error) => {
        console.error(`Queue ${queue.name} error:`, error);
    });
    queue.on('failed', (job, error) => {
        console.error(`Job ${job.id} in queue ${queue.name} failed:`, error);
    });
});
