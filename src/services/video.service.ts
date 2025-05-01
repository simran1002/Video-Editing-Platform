import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { Video, VideoStatus } from '../models/video.model';
import { Trim, EditStatus } from '../models/trim.model';
import { Subtitle } from '../models/subtitle.model';
import { videoProcessingQueue, trimQueue, subtitleQueue, renderQueue } from '../config/queue';

export const uploadVideo = async (file: Express.Multer.File, title: string): Promise<any> => {
  try {
    const video = await Video.create({
      id: uuidv4(),
      title,
      originalFilename: file.originalname,
      filePath: file.path,
      status: VideoStatus.UPLOADED
    });

    await videoProcessingQueue.add({ videoId: video.id }, { 
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    return video;
  } catch (error) {
    console.error('Error uploading video:', error);
    throw error;
  }
};

export const getVideoById = async (id: string): Promise<any> => {
  try {
    const video = await Video.findByPk(id, {
      include: [
        { model: Trim, as: 'trims' },
        { model: Subtitle, as: 'subtitles' }
      ]
    });

    if (!video) {
      throw new Error(`Video with ID ${id} not found`);
    }

    return video;
  } catch (error) {
    console.error(`Error getting video ${id}:`, error);
    throw error;
  }
};

export const trimVideo = async (videoId: string, startTime: number, endTime: number): Promise<any> => {
  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    const trim = await Trim.create({
      id: uuidv4(),
      videoId,
      startTime,
      endTime,
      status: EditStatus.PENDING
    });

    await trimQueue.add({ trimId: trim.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    return trim;
  } catch (error) {
    console.error(`Error trimming video ${videoId}:`, error);
    throw error;
  }
};

export const addSubtitle = async (videoId: string, text: string, startTime: number, endTime: number): Promise<any> => {
  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    const subtitle = await Subtitle.create({
      id: uuidv4(),
      videoId,
      text,
      startTime,
      endTime,
      status: EditStatus.PENDING
    });

    await subtitleQueue.add({ subtitleId: subtitle.id }, {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 }
    });

    return subtitle;
  } catch (error) {
    console.error(`Error adding subtitle to video ${videoId}:`, error);
    throw error;
  }
};

function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}
export const renderVideo = async (videoId: string, edits: Array<{ type: string, id: string }>): Promise<any> => {
  try {
    if (!isValidUUID(videoId)) {
      throw new Error(`Invalid video ID format: ${videoId}`);
    }
    const video = await Video.findByPk(videoId);
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

    const job = await renderQueue.add({ videoId, edits: validatedEdits }, {
      attempts: 2,
      backoff: { type: 'exponential', delay: 10000 }
    });

    return { jobId: job.id, message: 'Video render job added to queue' };
  } catch (error) {
    console.error(`Error rendering video ${videoId}:`, error);
    throw error;
  }
};

export const downloadVideo = async (videoId: string, type: string): Promise<string> => {
  try {
    const video = await Video.findByPk(videoId, {
      include: [
        { model: Trim, as: 'trims' },
        { model: Subtitle, as: 'subtitles' }
      ]
    });
    
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    let filePath = '';

    if (type === 'original') {
      filePath = video.filePath;
    } else if (type === 'rendered') {
      if (!video.renderedPath) {
        throw new Error('Rendered video not available');
      }
      filePath = video.renderedPath;
    } else if (type === 'trimmed') {
      const trims = video.get('trims') as Trim[];
      
      if (!trims || trims.length === 0) {
        throw new Error('No trim operations found for this video');
      }
      
      const completedTrims = trims.filter(trim => trim.status === EditStatus.COMPLETED);
      
      if (completedTrims.length === 0) {
        throw new Error('No completed trim operations found for this video');
      }
      
      completedTrims.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const latestTrim = completedTrims[0];
      
      if (!latestTrim.outputPath) {
        throw new Error('Trim output path not available');
      }
      
      filePath = latestTrim.outputPath;
    } else if (type === 'subtitled') {
      const subtitles = video.get('subtitles') as Subtitle[];
      
      if (!subtitles || subtitles.length === 0) {
        throw new Error('No subtitle operations found for this video');
      }
      
      const completedSubtitles = subtitles.filter(subtitle => subtitle.status === EditStatus.COMPLETED);
      
      if (completedSubtitles.length === 0) {
        throw new Error('No completed subtitle operations found for this video');
      }
      
      completedSubtitles.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      const latestSubtitle = completedSubtitles[0];
      
      if (!latestSubtitle.outputPath) {
        throw new Error('Subtitle output path not available');
      }
      
      filePath = latestSubtitle.outputPath;
    } else if (type === 'combined') {
      if (!video.renderedPath) {
        throw new Error('Combined video not available. Please render the video first with all edits.');
      }
      
      filePath = video.renderedPath;
    } else {
      throw new Error('Invalid download type');
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      throw new Error('Video file not found');
    }

    return filePath;
  } catch (error) {
    console.error(`Error downloading video ${videoId}:`, error);
    throw error;
  }
};
