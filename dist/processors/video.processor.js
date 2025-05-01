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
exports.processRender = exports.processSubtitle = exports.processTrim = exports.processVideo = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const fluent_ffmpeg_1 = __importDefault(require("fluent-ffmpeg"));
const video_model_1 = require("../models/video.model");
const trim_model_1 = require("../models/trim.model");
const subtitle_model_1 = require("../models/subtitle.model");
const video_utils_1 = require("../utils/video.utils");
const processVideo = (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoId } = job.data;
    try {
        const video = yield video_model_1.Video.findByPk(videoId);
        if (!video) {
            throw new Error(`Video with ID ${videoId} not found`);
        }
        yield video.update({ status: video_model_1.VideoStatus.PROCESSING });
        const metadata = yield (0, video_utils_1.getVideoMetadata)(video.filePath);
        const uploadDir = process.env.UPLOAD_DIR || 'uploads';
        const thumbnailPath = path_1.default.join(uploadDir, `${video.id}_thumbnail.jpg`);
        yield (0, video_utils_1.generateThumbnail)(video.filePath, thumbnailPath);
        yield video.update({
            duration: metadata.duration,
            thumbnailPath,
            status: video_model_1.VideoStatus.READY
        });
        console.log(`Video ${videoId} processed successfully`);
    }
    catch (error) {
        console.error(`Error processing video ${videoId}:`, error);
        yield video_model_1.Video.update({ status: video_model_1.VideoStatus.FAILED }, { where: { id: videoId } });
        throw error;
    }
});
exports.processVideo = processVideo;
const processTrim = (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { trimId } = job.data;
    try {
        const trim = yield trim_model_1.Trim.findByPk(trimId, {
            include: [{ model: video_model_1.Video, as: 'Video' }]
        });
        if (!trim) {
            throw new Error(`Trim with ID ${trimId} not found`);
        }
        yield trim.update({ status: trim_model_1.EditStatus.PROCESSING });
        const video = yield video_model_1.Video.findByPk(trim.videoId);
        if (!video) {
            throw new Error(`Video with ID ${trim.videoId} not found`);
        }
        const outputDir = process.env.OUTPUT_DIR || 'outputs';
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path_1.default.join(outputDir, `${video.id}_trim_${trim.id}.mp4`);
        yield new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(video.filePath)
                .setStartTime(trim.startTime)
                .setDuration(trim.endTime - trim.startTime)
                .output(outputPath)
                .on('end', () => {
                console.log(`Trim ${trimId} completed successfully`);
                resolve();
            })
                .on('error', (err) => {
                console.error(`Error trimming video ${trimId}:`, err);
                reject(err);
            })
                .run();
        });
        yield trim.update({
            outputPath,
            status: trim_model_1.EditStatus.COMPLETED
        });
    }
    catch (error) {
        console.error(`Error processing trim ${trimId}:`, error);
        yield trim_model_1.Trim.update({ status: trim_model_1.EditStatus.FAILED }, { where: { id: trimId } });
        throw error;
    }
});
exports.processTrim = processTrim;
const processSubtitle = (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { subtitleId } = job.data;
    try {
        const subtitle = yield subtitle_model_1.Subtitle.findByPk(subtitleId);
        if (!subtitle) {
            throw new Error(`Subtitle with ID ${subtitleId} not found`);
        }
        yield subtitle.update({ status: trim_model_1.EditStatus.PROCESSING });
        const video = yield video_model_1.Video.findByPk(subtitle.videoId);
        if (!video) {
            throw new Error(`Video with ID ${subtitle.videoId} not found`);
        }
        const outputDir = process.env.OUTPUT_DIR || 'outputs';
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const srtPath = path_1.default.join(outputDir, `${subtitle.id}.srt`);
        const srtContent = `1\n${formatTime(subtitle.startTime)} --> ${formatTime(subtitle.endTime)}\n${subtitle.text}\n`;
        fs_1.default.writeFileSync(srtPath, srtContent);
        const outputPath = path_1.default.join(outputDir, `${video.id}_subtitle_${subtitle.id}.mp4`);
        yield new Promise((resolve, reject) => {
            (0, fluent_ffmpeg_1.default)(video.filePath)
                .outputOptions([
                `-vf subtitles=${srtPath.replace(/\\/g, '/')}`
            ])
                .output(outputPath)
                .on('end', () => {
                console.log(`Subtitle ${subtitleId} added successfully`);
                resolve();
            })
                .on('error', (err) => {
                console.error(`Error adding subtitle ${subtitleId}:`, err);
                reject(err);
            })
                .run();
        });
        yield subtitle.update({
            outputPath,
            status: trim_model_1.EditStatus.COMPLETED
        });
    }
    catch (error) {
        console.error(`Error processing subtitle ${subtitleId}:`, error);
        yield subtitle_model_1.Subtitle.update({ status: trim_model_1.EditStatus.FAILED }, { where: { id: subtitleId } });
        throw error;
    }
});
exports.processSubtitle = processSubtitle;
const processRender = (job) => __awaiter(void 0, void 0, void 0, function* () {
    const { videoId, edits } = job.data;
    try {
        console.log(`Processing render job ${job.id}`);
        if (!isValidUUID(videoId)) {
            throw new Error(`Invalid video ID format: ${videoId}`);
        }
        const video = yield video_model_1.Video.findByPk(videoId);
        if (!video) {
            throw new Error(`Video with ID ${videoId} not found`);
        }
        const outputDir = process.env.OUTPUT_DIR || 'outputs';
        if (!fs_1.default.existsSync(outputDir)) {
            fs_1.default.mkdirSync(outputDir, { recursive: true });
        }
        const outputPath = path_1.default.join(outputDir, `${video.id}_rendered.mp4`);
        const validInputs = [];
        for (let i = 0; i < edits.length; i++) {
            const edit = edits[i];
            if (!isValidUUID(edit.id)) {
                console.warn(`Invalid ${edit.type} ID format: ${edit.id}, skipping this edit`);
                continue;
            }
            if (edit.type === 'trim') {
                const trimId = edit.id;
                console.log(`Looking for trim with ID: ${trimId}`);
                const trim = yield trim_model_1.Trim.findByPk(trimId);
                if (trim && trim.outputPath) {
                    validInputs.push({
                        type: 'trim',
                        path: trim.outputPath,
                        id: trimId
                    });
                }
                else {
                    console.warn(`Trim with ID ${trimId} not found or has no output path`);
                }
            }
            else if (edit.type === 'subtitle') {
                const subtitleId = edit.id;
                console.log(`Looking for subtitle with ID: ${subtitleId}`);
                const subtitle = yield subtitle_model_1.Subtitle.findByPk(subtitleId);
                if (subtitle && subtitle.outputPath) {
                    validInputs.push({
                        type: 'subtitle',
                        path: subtitle.outputPath,
                        id: subtitleId
                    });
                }
                else {
                    console.warn(`Subtitle with ID ${subtitleId} not found or has no output path`);
                }
            }
        }
        if (validInputs.length === 0) {
            console.log('No valid edits found, using original video');
            yield new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(video.filePath)
                    .output(outputPath)
                    .on('end', () => {
                    console.log(`Render for video ${videoId} completed successfully (original copy)`);
                    resolve();
                })
                    .on('error', (err) => {
                    console.error(`Error rendering video ${videoId}:`, err);
                    reject(err);
                })
                    .run();
            });
        }
        else if (validInputs.length === 1) {
            console.log(`Using single edit: ${validInputs[0].type} (${validInputs[0].id})`);
            yield new Promise((resolve, reject) => {
                (0, fluent_ffmpeg_1.default)(validInputs[0].path)
                    .output(outputPath)
                    .on('end', () => {
                    console.log(`Render for video ${videoId} completed successfully (single edit)`);
                    resolve();
                })
                    .on('error', (err) => {
                    console.error(`Error rendering video ${videoId}:`, err);
                    reject(err);
                })
                    .run();
            });
        }
        else {
            console.log(`Combining multiple edits: ${validInputs.length} edits`);
            const trimInputs = validInputs.filter(input => input.type === 'trim');
            const subtitleInputs = validInputs.filter(input => input.type === 'subtitle');
            console.log(`Found ${trimInputs.length} trim edits and ${subtitleInputs.length} subtitle edits`);
            if (trimInputs.length > 0 && subtitleInputs.length === 0) {
                const trimInput = trimInputs[0];
                console.log(`Using first trim (${trimInput.id}) as final output`);
                yield new Promise((resolve, reject) => {
                    (0, fluent_ffmpeg_1.default)(trimInput.path)
                        .output(outputPath)
                        .on('start', (commandLine) => {
                        console.log('FFmpeg command:', commandLine);
                    })
                        .on('end', () => {
                        console.log(`Render for video ${videoId} completed successfully (trim only)`);
                        resolve();
                    })
                        .on('error', (err) => {
                        console.error(`Error rendering video ${videoId}:`, err);
                        reject(err);
                    })
                        .run();
                });
            }
            else if (trimInputs.length === 0 && subtitleInputs.length > 0) {
                const subtitleInput = subtitleInputs[0];
                console.log(`Using first subtitle (${subtitleInput.id}) as final output`);
                yield new Promise((resolve, reject) => {
                    (0, fluent_ffmpeg_1.default)(subtitleInput.path)
                        .output(outputPath)
                        .on('start', (commandLine) => {
                        console.log('FFmpeg command:', commandLine);
                    })
                        .on('end', () => {
                        console.log(`Render for video ${videoId} completed successfully (subtitle only)`);
                        resolve();
                    })
                        .on('error', (err) => {
                        console.error(`Error rendering video ${videoId}:`, err);
                        reject(err);
                    })
                        .run();
                });
            }
            else if (trimInputs.length > 0 && subtitleInputs.length > 0) {
                const trimInput = trimInputs[0];
                const subtitleInput = subtitleInputs[0];
                console.log(`Applying subtitle (${subtitleInput.id}) to trimmed video (${trimInput.id})`);
                const subtitle = yield subtitle_model_1.Subtitle.findByPk(subtitleInput.id);
                if (!subtitle) {
                    throw new Error(`Subtitle with ID ${subtitleInput.id} not found`);
                }
                const srtFilePath = path_1.default.join(outputDir, `${video.id}_subtitle.srt`);
                const srtContent = `1\n${formatTime(subtitle.startTime)} --> ${formatTime(subtitle.endTime)}\n${subtitle.text}\n`;
                console.log(`Creating SRT file at ${srtFilePath} with content:`);
                console.log(srtContent);
                fs_1.default.writeFileSync(srtFilePath, srtContent);
                try {
                    yield new Promise((resolve, reject) => {
                        (0, fluent_ffmpeg_1.default)(trimInput.path)
                            .outputOptions([
                            `-vf subtitles=${srtFilePath.replace(/\\/g, '/').replace(/:/g, '\\:')}`
                        ])
                            .output(outputPath)
                            .on('start', (commandLine) => {
                            console.log('FFmpeg command:', commandLine);
                        })
                            .on('end', () => {
                            console.log(`Render for video ${videoId} completed successfully (trim+subtitle)`);
                            resolve();
                        })
                            .on('error', (err) => {
                            console.error(`Error rendering video ${videoId}:`, err);
                            reject(err);
                        })
                            .run();
                    });
                }
                finally {
                    if (fs_1.default.existsSync(srtFilePath)) {
                        fs_1.default.unlinkSync(srtFilePath);
                        console.log(`Deleted temporary SRT file: ${srtFilePath}`);
                    }
                }
            }
            else {
                throw new Error(`Unexpected combination of edits: ${validInputs.length} total, ${trimInputs.length} trims, ${subtitleInputs.length} subtitles`);
            }
        }
        yield video.update({
            renderedPath: outputPath
        });
        console.log(`Video ${videoId} rendered successfully`);
    }
    catch (error) {
        console.error(`Error rendering video ${videoId}:`, error);
        throw error;
    }
});
exports.processRender = processRender;
function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}
function isValidUUID(uuid) {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
}
