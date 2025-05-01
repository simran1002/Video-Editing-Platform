"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateThumbnail = exports.checkFfmpegAvailability = exports.getVideoMetadata = exports.getVideoDuration = void 0;
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
/**
 * Get the duration of a video file in seconds
 * @param filePath Path to the video file
 * @returns Promise that resolves to the duration in seconds
 */
const getVideoDuration = (filePath) => {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
            if (err) {
                return reject(err);
            }
            // Get duration from metadata
            const duration = metadata.format.duration || 0;
            resolve(duration);
        });
    });
};
exports.getVideoDuration = getVideoDuration;
/**
 * Get video metadata including width, height, codec, etc.
 * @param filePath Path to the video file
 * @returns Promise that resolves to the video metadata
 */
const getVideoMetadata = (filePath) => {
    return new Promise((resolve, reject) => {
        fluent_ffmpeg_1.default.ffprobe(filePath, (err, metadata) => {
            if (err) {
                return reject(err);
            }
            resolve(metadata);
        });
    });
};
exports.getVideoMetadata = getVideoMetadata;
/**
 * Check if FFmpeg is installed and accessible
 * @returns Promise that resolves to true if FFmpeg is available
 */
const checkFfmpegAvailability = () => {
    return new Promise((resolve) => {
        fluent_ffmpeg_1.default.getAvailableFormats((err) => {
            if (err) {
                resolve(false);
            }
            else {
                resolve(true);
            }
        });
    });
};
exports.checkFfmpegAvailability = checkFfmpegAvailability;
/**
 * Generate a thumbnail from a video at a specific time
 * @param videoPath Path to the video file
 * @param outputPath Path to save the thumbnail
 * @param timeInSeconds Time in seconds to capture the thumbnail
 * @returns Promise that resolves when the thumbnail is generated
 */
const generateThumbnail = (videoPath, outputPath, timeInSeconds = 0) => {
    return new Promise((resolve, reject) => {
        (0, fluent_ffmpeg_1.default)(videoPath)
            .screenshots({
            timestamps: [timeInSeconds],
            filename: '%b.png',
            folder: outputPath,
            size: '320x240'
        })
            .on('end', () => {
            resolve();
        })
            .on('error', (err) => {
            reject(err);
        });
    });
};
exports.generateThumbnail = generateThumbnail;
