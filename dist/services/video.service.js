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
exports.VideoService = void 0;
const client_1 = require("@prisma/client");
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const fs_1 = __importDefault(require("fs"));
const prisma = new client_1.PrismaClient();
const outputDir = process.env.OUTPUT_DIR || 'outputs';
/**
 * Service class for handling video operations
 */
class VideoService {
    /**
     * Create a new video record in the database
     */
    createVideo(filename, filePath, size, duration) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.video.create({
                data: {
                    filename,
                    originalPath: filePath,
                    size,
                    duration,
                    status: 'UPLOADED'
                }
            });
        });
    }
    /**
     * Get a video by ID with its edits
     */
    getVideoById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.video.findUnique({
                where: { id },
                include: {
                    trims: true,
                    subtitles: true
                }
            });
        });
    }
    /**
     * Create a trim operation for a video
     */
    createTrim(videoId, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.trim.create({
                data: {
                    videoId,
                    startTime,
                    endTime,
                    status: 'PROCESSING'
                }
            });
        });
    }
    /**
     * Update a trim operation status
     */
    updateTrimStatus(id, outputPath, status) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.trim.update({
                where: { id },
                data: {
                    outputPath,
                    status
                }
            });
        });
    }
    /**
     * Create a subtitle for a video
     */
    createSubtitle(videoId, text, startTime, endTime) {
        return __awaiter(this, void 0, void 0, function* () {
            return prisma.subtitle.create({
                data: {
                    videoId,
                    text,
                    startTime,
                    endTime,
                    status: 'PENDING'
                }
            });
        });
    }
    /**
     * Update video status
     */
    updateVideoStatus(id, status, outputPath) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = { status };
            if (outputPath) {
                data.outputPath = outputPath;
            }
            return prisma.video.update({
                where: { id },
                data
            });
        });
    }
    /**
     * Process a video trim using FFmpeg
     */
    processTrim(videoPath, startTime, endTime, outputPath) {
        return new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(videoPath)
                .setStartTime(startTime)
                .setDuration(endTime - startTime)
                .output(outputPath)
                .on('end', () => {
                resolve();
            })
                .on('error', (err) => {
                reject(err);
            })
                .run();
        });
    }
    /**
     * Generate a subtitle file in SRT format
     */
    generateSubtitleFile(subtitles, outputPath) {
        let srtContent = '';
        subtitles.forEach((subtitle, index) => {
            const startTimeFormatted = this.formatSrtTime(subtitle.startTime);
            const endTimeFormatted = this.formatSrtTime(subtitle.endTime);
            srtContent += `${index + 1}\n${startTimeFormatted} --> ${endTimeFormatted}\n${subtitle.text}\n\n`;
        });
        fs_1.default.writeFileSync(outputPath, srtContent);
    }
    /**
     * Format time in seconds to SRT time format (HH:MM:SS,mmm)
     */
    formatSrtTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds * 1000) % 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
    }
}
exports.VideoService = VideoService;
