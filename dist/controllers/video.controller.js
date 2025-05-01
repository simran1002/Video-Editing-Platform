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
exports.downloadVideoController = exports.renderVideoController = exports.addSubtitleController = exports.trimVideoController = exports.getVideoByIdController = exports.uploadVideoController = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const video_service_1 = require("../services/video.service");
const outputDir = process.env.OUTPUT_DIR || 'outputs';
if (!fs_1.default.existsSync(outputDir)) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
}
const uploadVideoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No video file uploaded' });
            return;
        }
        const { title } = req.body;
        if (!title) {
            res.status(400).json({ error: 'Title is required' });
            return;
        }
        const video = yield (0, video_service_1.uploadVideo)(req.file, title);
        res.status(201).json(video);
    }
    catch (error) {
        console.error('Error uploading video:', error);
        res.status(500).json({ error: error.message || 'Error uploading video' });
    }
});
exports.uploadVideoController = uploadVideoController;
const getVideoByIdController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const video = yield (0, video_service_1.getVideoById)(id);
        res.status(200).json(video);
    }
    catch (error) {
        console.error(`Error getting video ${req.params.id}:`, error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Error getting video'
        });
    }
});
exports.getVideoByIdController = getVideoByIdController;
const trimVideoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { startTime, endTime } = req.body;
        if (startTime === undefined || endTime === undefined) {
            res.status(400).json({ error: 'Start time and end time are required' });
            return;
        }
        if (startTime < 0 || endTime <= startTime) {
            res.status(400).json({ error: 'Invalid time range' });
            return;
        }
        const trim = yield (0, video_service_1.trimVideo)(id, parseFloat(startTime), parseFloat(endTime));
        res.status(202).json({
            message: 'Trim operation added to processing queue',
            trim
        });
    }
    catch (error) {
        console.error(`Error trimming video ${req.params.id}:`, error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Error trimming video'
        });
    }
});
exports.trimVideoController = trimVideoController;
const addSubtitleController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { text, startTime, endTime } = req.body;
        if (!text || startTime === undefined || endTime === undefined) {
            res.status(400).json({ error: 'Text, start time, and end time are required' });
            return;
        }
        if (startTime < 0 || endTime <= startTime) {
            res.status(400).json({ error: 'Invalid time range' });
            return;
        }
        const subtitle = yield (0, video_service_1.addSubtitle)(id, text, parseFloat(startTime), parseFloat(endTime));
        res.status(202).json({
            message: 'Subtitle operation added to processing queue',
            subtitle
        });
    }
    catch (error) {
        console.error(`Error adding subtitle to video ${req.params.id}:`, error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Error adding subtitle'
        });
    }
});
exports.addSubtitleController = addSubtitleController;
const renderVideoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { edits } = req.body;
        if (!edits || !Array.isArray(edits) || edits.length === 0) {
            res.status(400).json({ error: 'Edits array is required' });
            return;
        }
        for (const edit of edits) {
            if (!edit.type || !edit.id) {
                res.status(400).json({ error: 'Each edit must have a type and id' });
                return;
            }
            if (!['trim', 'subtitle'].includes(edit.type)) {
                res.status(400).json({ error: 'Edit type must be trim or subtitle' });
                return;
            }
        }
        const result = yield (0, video_service_1.renderVideo)(id, edits);
        res.status(202).json(Object.assign({ message: 'Render operation added to processing queue' }, result));
    }
    catch (error) {
        console.error(`Error rendering video ${req.params.id}:`, error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Error rendering video'
        });
    }
});
exports.renderVideoController = renderVideoController;
const downloadVideoController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { type = 'original' } = req.query;
        if (!['original', 'rendered', 'trimmed', 'subtitled', 'combined'].includes(type)) {
            res.status(400).json({
                error: 'Invalid download type. Must be one of: original, rendered, trimmed, subtitled, combined'
            });
            return;
        }
        const filePath = yield (0, video_service_1.downloadVideo)(id, type);
        res.setHeader('Content-Disposition', `attachment; filename=${path_1.default.basename(filePath)}`);
        res.setHeader('Content-Type', 'video/mp4');
        const fileStream = fs_1.default.createReadStream(filePath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error(`Error downloading video ${req.params.id}:`, error);
        res.status(error.message.includes('not found') ? 404 : 500).json({
            error: error.message || 'Error downloading video'
        });
    }
});
exports.downloadVideoController = downloadVideoController;
