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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadVideo = exports.renderVideo = exports.addSubtitle = exports.trimVideo = exports.getVideoById = exports.uploadVideo = void 0;
const uuid_1 = require("uuid");
const fs_1 = __importDefault(require("fs"));
const video_model_1 = require("../models/video.model");
const trim_model_1 = require("../models/trim.model");
const subtitle_model_1 = require("../models/subtitle.model");
const queue_1 = require("../config/queue");
const uploadVideo = (file, title) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield video_model_1.Video.create({
            id: (0, uuid_1.v4)(),
            title,
            originalFilename: file.originalname,
            filePath: file.path,
            status: video_model_1.VideoStatus.UPLOADED
        });
        yield queue_1.videoProcessingQueue.add({ videoId: video.id }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });
        return video;
    }
    catch (error) {
        console.error('Error uploading video:', error);
        throw error;
    }
});
exports.uploadVideo = uploadVideo;
const getVideoById = (id) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield video_model_1.Video.findByPk(id, {
            include: [
                { model: trim_model_1.Trim, as: 'trims' },
                { model: subtitle_model_1.Subtitle, as: 'subtitles' }
            ]
        });
        if (!video) {
            throw new Error(`Video with ID ${id} not found`);
        }
        return video;
    }
    catch (error) {
        console.error(`Error getting video ${id}:`, error);
        throw error;
    }
});
exports.getVideoById = getVideoById;
const trimVideo = (videoId, startTime, endTime) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield video_model_1.Video.findByPk(videoId);
        if (!video) {
            throw new Error(`Video with ID ${videoId} not found`);
        }
        const trim = yield trim_model_1.Trim.create({
            id: (0, uuid_1.v4)(),
            videoId,
            startTime,
            endTime,
            status: trim_model_1.EditStatus.PENDING
        });
        yield queue_1.trimQueue.add({ trimId: trim.id }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });
        return trim;
    }
    catch (error) {
        console.error(`Error trimming video ${videoId}:`, error);
        throw error;
    }
});
exports.trimVideo = trimVideo;
const addSubtitle = (videoId, text, startTime, endTime) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield video_model_1.Video.findByPk(videoId);
        if (!video) {
            throw new Error(`Video with ID ${videoId} not found`);
        }
        const subtitle = yield subtitle_model_1.Subtitle.create({
            id: (0, uuid_1.v4)(),
            videoId,
            text,
            startTime,
            endTime,
            status: trim_model_1.EditStatus.PENDING
        });
        yield queue_1.subtitleQueue.add({ subtitleId: subtitle.id }, {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 }
        });
        return subtitle;
    }
    catch (error) {
        console.error(`Error adding subtitle to video ${videoId}:`, error);
        throw error;
    }
});
exports.addSubtitle = addSubtitle;
function isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}
const renderVideo = (videoId, edits) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!isValidUUID(videoId)) {
            throw new Error(`Invalid video ID format: ${videoId}`);
        }
        const video = yield video_model_1.Video.findByPk(videoId);
        if (!video) {
            throw new Error(`Video with ID ${videoId} not found`);
        }
        const validatedEdits = edits.filter(edit => {
            if (!isValidUUID(edit.id)) {
                console.warn(`Invalid ${edit.type} ID format: ${edit.id}, skipping this edit`);
                return false;
            }
            return true;
        });
        if (validatedEdits.length === 0) {
            throw new Error('No valid edits found after validation');
        }
        const job = yield queue_1.renderQueue.add({ videoId, edits: validatedEdits }, {
            attempts: 2,
            backoff: { type: 'exponential', delay: 10000 }
        });
        return { jobId: job.id, message: 'Video render job added to queue' };
    }
    catch (error) {
        console.error(`Error rendering video ${videoId}:`, error);
        throw error;
    }
});
exports.renderVideo = renderVideo;
const downloadVideo = (videoId, type) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const video = yield video_model_1.Video.findByPk(videoId, {
            include: [
                { model: trim_model_1.Trim, as: 'trims' },
                { model: subtitle_model_1.Subtitle, as: 'subtitles' }
            ]
        });
        if (!video) {
            throw new Error(`Video with ID ${videoId} not found`);
        }
        let filePath = '';
        if (type === 'original') {
            filePath = video.filePath;
        }
        else if (type === 'rendered') {
            if (!video.renderedPath) {
                throw new Error('Rendered video not available');
            }
            filePath = video.renderedPath;
        }
        else if (type === 'trimmed') {
            const trims = video.get('trims');
            if (!trims || trims.length === 0) {
                throw new Error('No trim operations found for this video');
            }
            const completedTrims = trims.filter(trim => trim.status === trim_model_1.EditStatus.COMPLETED);
            if (completedTrims.length === 0) {
                throw new Error('No completed trim operations found for this video');
            }
            completedTrims.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latestTrim = completedTrims[0];
            if (!latestTrim.outputPath) {
                throw new Error('Trim output path not available');
            }
            filePath = latestTrim.outputPath;
        }
        else if (type === 'subtitled') {
            const subtitles = video.get('subtitles');
            if (!subtitles || subtitles.length === 0) {
                throw new Error('No subtitle operations found for this video');
            }
            const completedSubtitles = subtitles.filter(subtitle => subtitle.status === trim_model_1.EditStatus.COMPLETED);
            if (completedSubtitles.length === 0) {
                throw new Error('No completed subtitle operations found for this video');
            }
            completedSubtitles.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            const latestSubtitle = completedSubtitles[0];
            if (!latestSubtitle.outputPath) {
                throw new Error('Subtitle output path not available');
            }
            filePath = latestSubtitle.outputPath;
        }
        else if (type === 'combined') {
            if (!video.renderedPath) {
                throw new Error('Combined video not available. Please render the video first with all edits.');
            }
            filePath = video.renderedPath;
        }
        else {
            throw new Error('Invalid download type');
        }
        if (!fs_1.default.existsSync(filePath)) {
            throw new Error('Video file not found');
        }
        return filePath;
    }
    catch (error) {
        console.error(`Error downloading video ${videoId}:`, error);
        throw error;
    }
});
exports.downloadVideo = downloadVideo;
