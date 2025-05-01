"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.videoRoutes = void 0;
const express_1 = __importDefault(require("express"));
const video_controller_1 = require("../controllers/video.controller");
const upload_middleware_1 = require("../middlewares/upload.middleware");
const router = express_1.default.Router();
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};
/**
 * @swagger
 * /videos/upload:
 *   post:
 *     summary: Upload a new video
 *     description: Upload a video file to the server
 *     tags: [Videos]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - video
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: Video file to upload
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video uploaded successfully
 *                 video:
 *                   $ref: '#/components/schemas/Video'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/upload', upload_middleware_1.upload.single('video'), asyncHandler(video_controller_1.uploadVideo));
/**
 * @swagger
 * /videos/{id}:
 *   get:
 *     summary: Get video by ID
 *     description: Retrieve a video by its ID along with its edits
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to retrieve
 *     responses:
 *       200:
 *         description: Video details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 video:
 *                   $ref: '#/components/schemas/Video'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id', asyncHandler(video_controller_1.getVideoById));
/**
 * @swagger
 * /videos/{id}/trim:
 *   post:
 *     summary: Trim a video
 *     description: Create a trimmed version of a video by specifying start and end times
 *     tags: [Video Editing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to trim
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startTime
 *               - endTime
 *             properties:
 *               startTime:
 *                 type: number
 *                 description: Start time in seconds
 *                 example: 10.5
 *               endTime:
 *                 type: number
 *                 description: End time in seconds
 *                 example: 20.5
 *     responses:
 *       202:
 *         description: Video trim operation started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video trim started
 *                 trim:
 *                   $ref: '#/components/schemas/Trim'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/trim', asyncHandler(video_controller_1.trimVideo));
/**
 * @swagger
 * /videos/{id}/subtitles:
 *   post:
 *     summary: Add subtitles to a video
 *     description: Add subtitle text to a video at specified start and end times
 *     tags: [Video Editing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to add subtitles to
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - text
 *               - startTime
 *               - endTime
 *             properties:
 *               text:
 *                 type: string
 *                 description: Subtitle text
 *                 example: This is a subtitle
 *               startTime:
 *                 type: number
 *                 description: Start time in seconds
 *                 example: 5.0
 *               endTime:
 *                 type: number
 *                 description: End time in seconds
 *                 example: 8.0
 *     responses:
 *       201:
 *         description: Subtitle added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Subtitle added successfully
 *                 subtitle:
 *                   $ref: '#/components/schemas/Subtitle'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/subtitles', asyncHandler(video_controller_1.addSubtitles));
/**
 * @swagger
 * /videos/{id}/render:
 *   post:
 *     summary: Render final video
 *     description: Combine all edits and render the final video
 *     tags: [Video Editing]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to render
 *     responses:
 *       202:
 *         description: Video rendering started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Video rendering started
 *                 video:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: PROCESSING
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post('/:id/render', asyncHandler(video_controller_1.renderVideo));
/**
 * @swagger
 * /videos/{id}/download:
 *   get:
 *     summary: Download rendered video
 *     description: Download the final rendered video file
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the video to download
 *     responses:
 *       200:
 *         description: Video file stream
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/:id/download', asyncHandler(video_controller_1.downloadVideo));
exports.videoRoutes = router;
