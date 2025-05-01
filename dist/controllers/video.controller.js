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
exports.downloadVideo = exports.renderVideo = exports.addSubtitles = exports.trimVideo = exports.getVideoById = exports.uploadVideo = void 0;
const client_1 = require("@prisma/client");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const video_utils_1 = require("../utils/video.utils");
// Initialize Prisma client
const prisma = new client_1.PrismaClient();
const outputDir = process.env.OUTPUT_DIR || 'outputs';
// Ensure output directory exists
if (!fs_1.default.existsSync(outputDir)) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
}
/**
 * Upload a video file
 */
const uploadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No video file uploaded' });
        }
        const { filename, path: filePath, size } = req.file;
        // Get video duration using ffmpeg
        const duration = yield (0, video_utils_1.getVideoDuration)(filePath);
        // Create video record in database
        const video = yield prisma.video.create({
            data: {
                filename,
                originalPath: filePath,
                size,
                duration,
                status: 'UPLOADED'
            }
        });
        return res.status(201).json({
            message: 'Video uploaded successfully',
            video
        });
    }
    catch (error) {
        console.error('Error uploading video:', error);
        return res.status(500).json({ error: 'Failed to upload video' });
    }
});
exports.uploadVideo = uploadVideo;
/**
 * Get video by ID
 */
const getVideoById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const video = yield prisma.video.findUnique({
            where: { id },
            include: {
                trims: true,
                subtitles: true
            }
        });
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        return res.status(200).json({ video });
    }
    catch (error) {
        console.error('Error getting video:', error);
        return res.status(500).json({ error: 'Failed to get video' });
    }
});
exports.getVideoById = getVideoById;
/**
 * Trim a video
 */
const trimVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { startTime, endTime } = req.body;
        if (startTime === undefined || endTime === undefined) {
            return res.status(400).json({ error: 'Start and end times are required' });
        }
        // Validate start and end times
        if (startTime < 0 || endTime <= startTime) {
            return res.status(400).json({ error: 'Invalid start or end time' });
        }
        // Get the video
        const video = yield prisma.video.findUnique({
            where: { id }
        });
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        // Create trim record
        const trim = yield prisma.trim.create({
            data: {
                videoId: id,
                startTime,
                endTime,
                status: 'PROCESSING'
            }
        });
        // Create output filename
        const outputFilename = `trim-${trim.id}${path_1.default.extname(video.filename)}`;
        const outputPath = path_1.default.join(outputDir, outputFilename);
        // Perform the trim operation with ffmpeg
        (0, fluent_ffmpeg_1.default)(video.originalPath)
            .setStartTime(startTime)
            .setDuration(endTime - startTime)
            .output(outputPath)
            .on('end', () => __awaiter(void 0, void 0, void 0, function* () {
            // Update trim record with output path and status
            yield prisma.trim.update({
                where: { id: trim.id },
                data: {
                    outputPath,
                    status: 'COMPLETED'
                }
            });
            console.log(`Trim completed: ${outputPath}`);
        }))
            .on('error', (err) => __awaiter(void 0, void 0, void 0, function* () {
            console.error('Error trimming video:', err);
            yield prisma.trim.update({
                where: { id: trim.id },
                data: {
                    status: 'FAILED'
                }
            });
        }))
            .run();
        return res.status(202).json({
            message: 'Video trim started',
            trim
        });
    }
    catch (error) {
        console.error('Error trimming video:', error);
        return res.status(500).json({ error: 'Failed to trim video' });
    }
});
exports.trimVideo = trimVideo;
/**
 * Add subtitles to a video
 */
const addSubtitles = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { text, startTime, endTime } = req.body;
        if (!text || startTime === undefined || endTime === undefined) {
            return res.status(400).json({ error: 'Text, start time, and end time are required' });
        }
        // Validate start and end times
        if (startTime < 0 || endTime <= startTime) {
            return res.status(400).json({ error: 'Invalid start or end time' });
        }
        // Get the video
        const video = yield prisma.video.findUnique({
            where: { id }
        });
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        // Create subtitle record
        const subtitle = yield prisma.subtitle.create({
            data: {
                videoId: id,
                text,
                startTime,
                endTime,
                status: 'PENDING'
            }
        });
        return res.status(201).json({
            message: 'Subtitle added successfully',
            subtitle
        });
    }
    catch (error) {
        console.error('Error adding subtitle:', error);
        return res.status(500).json({ error: 'Failed to add subtitle' });
    }
});
exports.addSubtitles = addSubtitles;
/**
 * Render the final video with all edits applied
 */
const renderVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get the video with all edits
        const video = yield prisma.video.findUnique({
            where: { id },
            include: {
                trims: {
                    where: { status: 'COMPLETED' }
                },
                subtitles: {
                    where: { status: 'PENDING' }
                }
            }
        });
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        // Update video status to processing
        yield prisma.video.update({
            where: { id },
            data: { status: 'PROCESSING' }
        });
        // Create output filename
        const outputFilename = `final-${id}${path_1.default.extname(video.filename)}`;
        const outputPath = path_1.default.join(outputDir, outputFilename);
        // Start with the original video or the first trim if available
        const inputPath = video.trims.length > 0 ? video.trims[0].outputPath : video.originalPath;
        // Create a complex ffmpeg command to apply all edits
        let command = (0, fluent_ffmpeg_1.default)(inputPath);
        // Add subtitles if any
        if (video.subtitles.length > 0) {
            // Create a temporary subtitle file (SRT format)
            const srtPath = path_1.default.join(outputDir, `subtitles-${id}.srt`);
            let srtContent = '';
            video.subtitles.forEach((subtitle, index) => {
                const startTimeFormatted = formatSrtTime(subtitle.startTime);
                const endTimeFormatted = formatSrtTime(subtitle.endTime);
                srtContent += `${index + 1}\n${startTimeFormatted} --> ${endTimeFormatted}\n${subtitle.text}\n\n`;
            });
            fs_1.default.writeFileSync(srtPath, srtContent);
            // Add subtitle filter
            command = command.addOption('-vf', `subtitles=${srtPath.replace(/\\/g, '/')}`);
        }
        // Output to final file
        command
            .output(outputPath)
            .on('end', () => __awaiter(void 0, void 0, void 0, function* () {
            // Update video record with output path and status
            yield prisma.video.update({
                where: { id },
                data: {
                    outputPath,
                    status: 'READY'
                }
            });
            // Update all subtitles to completed
            if (video.subtitles.length > 0) {
                yield prisma.subtitle.updateMany({
                    where: { videoId: id, status: 'PENDING' },
                    data: { status: 'COMPLETED' }
                });
            }
            console.log(`Video rendering completed: ${outputPath}`);
        }))
            .on('error', (err) => __awaiter(void 0, void 0, void 0, function* () {
            console.error('Error rendering video:', err);
            yield prisma.video.update({
                where: { id },
                data: { status: 'FAILED' }
            });
        }))
            .run();
        return res.status(202).json({
            message: 'Video rendering started',
            video: {
                id: video.id,
                status: 'PROCESSING'
            }
        });
    }
    catch (error) {
        console.error('Error rendering video:', error);
        return res.status(500).json({ error: 'Failed to render video' });
    }
});
exports.renderVideo = renderVideo;
/**
 * Download the final rendered video
 */
const downloadVideo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Get the video
        const video = yield prisma.video.findUnique({
            where: { id }
        });
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        if (video.status !== 'READY') {
            return res.status(400).json({ error: 'Video is not ready for download' });
        }
        if (!video.outputPath) {
            return res.status(400).json({ error: 'Video output path not found' });
        }
        // Check if the file exists
        if (!fs_1.default.existsSync(video.outputPath)) {
            return res.status(404).json({ error: 'Video file not found' });
        }
        // Set appropriate headers
        res.setHeader('Content-Disposition', `attachment; filename=${path_1.default.basename(video.outputPath)}`);
        res.setHeader('Content-Type', 'video/mp4');
        // Stream the file
        const fileStream = fs_1.default.createReadStream(video.outputPath);
        fileStream.pipe(res);
    }
    catch (error) {
        console.error('Error downloading video:', error);
        return res.status(500).json({ error: 'Failed to download video' });
    }
});
exports.downloadVideo = downloadVideo;
/**
 * Helper function to format time for SRT subtitles
 */
function formatSrtTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 1000) % 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}
