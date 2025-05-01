"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupQueueMonitoring = exports.startQueueWorkers = void 0;
const queue_1 = require("../config/queue");
const video_processor_1 = require("../processors/video.processor");
const startQueueWorkers = () => {
    queue_1.videoProcessingQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Processing video job ${job.id}`);
        yield (0, video_processor_1.processVideo)(job);
    }));
    queue_1.trimQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Processing trim job ${job.id}`);
        yield (0, video_processor_1.processTrim)(job);
    }));
    queue_1.subtitleQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Processing subtitle job ${job.id}`);
        yield (0, video_processor_1.processSubtitle)(job);
    }));
    queue_1.renderQueue.process((job) => __awaiter(void 0, void 0, void 0, function* () {
        console.log(`Processing render job ${job.id}`);
        yield (0, video_processor_1.processRender)(job);
    }));
    console.log('Queue workers started successfully');
};
exports.startQueueWorkers = startQueueWorkers;
const setupQueueMonitoring = () => {
    [queue_1.videoProcessingQueue, queue_1.trimQueue, queue_1.subtitleQueue, queue_1.renderQueue].forEach(queue => {
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
exports.setupQueueMonitoring = setupQueueMonitoring;
