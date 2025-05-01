import express from 'express';
import { 
  uploadVideoController, 
  getVideoByIdController, 
  trimVideoController, 
  addSubtitleController, 
  renderVideoController, 
  downloadVideoController 
} from '../controllers/video.controller';
import { upload } from '../middlewares/upload.middleware';
import asyncHandler from '../utils/async-handler';

const router = express.Router();

/**
 * @swagger
 * /api/videos:
 *   post:
 *     summary: Upload a new video
 *     tags: [Videos]
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               video:
 *                 type: string
 *                 format: binary
 *                 description: The video file to upload
 *               title:
 *                 type: string
 *                 description: Title for the video
 *             required:
 *               - video
 *               - title
 *     responses:
 *       201:
 *         description: Video uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Server error
 */
router.post('/', upload.single('video'), asyncHandler(uploadVideoController));

/**
 * @swagger
 * /api/videos/{id}:
 *   get:
 *     summary: Get a video by ID
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the video
 *     responses:
 *       200:
 *         description: Video details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Video'
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.get('/:id', asyncHandler(getVideoByIdController));

/**
 * @swagger
 * /api/videos/{id}/trim:
 *   post:
 *     summary: Trim a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the video
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               startTime:
 *                 type: number
 *                 description: Start time in seconds
 *               endTime:
 *                 type: number
 *                 description: End time in seconds
 *             required:
 *               - startTime
 *               - endTime
 *     responses:
 *       202:
 *         description: Trim operation started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trim'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.post('/:id/trim', asyncHandler(trimVideoController));

/**
 * @swagger
 * /api/videos/{id}/subtitles:
 *   post:
 *     summary: Add subtitles to a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the video
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Subtitle text
 *               startTime:
 *                 type: number
 *                 description: Start time in seconds
 *               endTime:
 *                 type: number
 *                 description: End time in seconds
 *             required:
 *               - text
 *               - startTime
 *               - endTime
 *     responses:
 *       202:
 *         description: Subtitle operation started
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Subtitle'
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.post('/:id/subtitles', asyncHandler(addSubtitleController));

/**
 * @swagger
 * /api/videos/{id}/render:
 *   post:
 *     summary: Render a video with all edits
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the video
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               edits:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [trim, subtitle]
 *                     id:
 *                       type: string
 *                   required:
 *                     - type
 *                     - id
 *             required:
 *               - edits
 *     responses:
 *       202:
 *         description: Render operation started
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.post('/:id/render', asyncHandler(renderVideoController));

/**
 * @swagger
 * /api/videos/{id}/download:
 *   get:
 *     summary: Download a video
 *     tags: [Videos]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the video
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [original, rendered]
 *         description: Type of video to download (default is original)
 *     responses:
 *       200:
 *         description: Video file stream
 *       400:
 *         description: Invalid request
 *       404:
 *         description: Video not found
 *       500:
 *         description: Server error
 */
router.get('/:id/download', asyncHandler(downloadVideoController));

export default router;
