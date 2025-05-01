import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { 
  uploadVideo, 
  getVideoById, 
  trimVideo, 
  addSubtitle, 
  renderVideo, 
  downloadVideo 
} from '../services/video.service';

const outputDir = process.env.OUTPUT_DIR || 'outputs';

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

export const uploadVideoController = async (req: Request, res: Response): Promise<void> => {
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

    const video = await uploadVideo(req.file, title);
    res.status(201).json(video);
  } catch (error: any) {
    console.error('Error uploading video:', error);
    res.status(500).json({ error: error.message || 'Error uploading video' });
  }
};


export const getVideoByIdController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const video = await getVideoById(id);
    res.status(200).json(video);
  } catch (error: any) {
    console.error(`Error getting video ${req.params.id}:`, error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Error getting video' 
    });
  }
};

export const trimVideoController = async (req: Request, res: Response): Promise<void> => {
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

    const trim = await trimVideo(id, parseFloat(startTime), parseFloat(endTime));
    res.status(202).json({
      message: 'Trim operation added to processing queue',
      trim
    });
  } catch (error: any) {
    console.error(`Error trimming video ${req.params.id}:`, error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Error trimming video' 
    });
  }
};

export const addSubtitleController = async (req: Request, res: Response): Promise<void> => {
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

    const subtitle = await addSubtitle(id, text, parseFloat(startTime), parseFloat(endTime));
    res.status(202).json({
      message: 'Subtitle operation added to processing queue',
      subtitle
    });
  } catch (error: any) {
    console.error(`Error adding subtitle to video ${req.params.id}:`, error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Error adding subtitle' 
    });
  }
};


export const renderVideoController = async (req: Request, res: Response): Promise<void> => {
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

    const result = await renderVideo(id, edits);
    res.status(202).json({
      message: 'Render operation added to processing queue',
      ...result
    });
  } catch (error: any) {
    console.error(`Error rendering video ${req.params.id}:`, error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Error rendering video' 
    });
  }
};


export const downloadVideoController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { type = 'original' } = req.query;

    if (!['original', 'rendered', 'trimmed', 'subtitled', 'combined'].includes(type as string)) {
      res.status(400).json({ 
        error: 'Invalid download type. Must be one of: original, rendered, trimmed, subtitled, combined' 
      });
      return;
    }

    const filePath = await downloadVideo(id, type as string);
    
    res.setHeader('Content-Disposition', `attachment; filename=${path.basename(filePath)}`);
    res.setHeader('Content-Type', 'video/mp4');
    
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error(`Error downloading video ${req.params.id}:`, error);
    res.status(error.message.includes('not found') ? 404 : 500).json({ 
      error: error.message || 'Error downloading video' 
    });
  }
};
