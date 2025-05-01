import { Job } from 'bull';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { Video, VideoStatus } from '../models/video.model';
import { Trim, EditStatus } from '../models/trim.model';
import { Subtitle } from '../models/subtitle.model';
import { getVideoMetadata, generateThumbnail } from '../utils/video.utils';

export const processVideo = async (job: Job): Promise<void> => {
  const { videoId } = job.data;
  
  try {
    const video = await Video.findByPk(videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    await video.update({ status: VideoStatus.PROCESSING });

    const metadata = await getVideoMetadata(video.filePath);
    
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    const thumbnailPath = path.join(uploadDir, `${video.id}_thumbnail.jpg`);
    await generateThumbnail(video.filePath, thumbnailPath);

    await video.update({
      duration: metadata.duration,
      thumbnailPath,
      status: VideoStatus.READY
    });

    console.log(`Video ${videoId} processed successfully`);
  } catch (error) {
    console.error(`Error processing video ${videoId}:`, error);
    await Video.update(
      { status: VideoStatus.FAILED },
      { where: { id: videoId } }
    );
    throw error;
  }
};

export const processTrim = async (job: Job): Promise<void> => {
  const { trimId } = job.data;
  
  try {
    const trim = await Trim.findByPk(trimId, {
      include: [{ model: Video, as: 'Video' }]
    });
    
    if (!trim) {
      throw new Error(`Trim with ID ${trimId} not found`);
    }

    await trim.update({ status: EditStatus.PROCESSING });

    const video = await Video.findByPk(trim.videoId);
    if (!video) {
      throw new Error(`Video with ID ${trim.videoId} not found`);
    }

    const outputDir = process.env.OUTPUT_DIR || 'outputs';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${video.id}_trim_${trim.id}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(video.filePath)
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

    await trim.update({
      outputPath,
      status: EditStatus.COMPLETED
    });
  } catch (error) {
    console.error(`Error processing trim ${trimId}:`, error);
    await Trim.update(
      { status: EditStatus.FAILED },
      { where: { id: trimId } }
    );
    throw error;
  }
};

export const processSubtitle = async (job: Job): Promise<void> => {
  const { subtitleId } = job.data;
  
  try {
    const subtitle = await Subtitle.findByPk(subtitleId);
    if (!subtitle) {
      throw new Error(`Subtitle with ID ${subtitleId} not found`);
    }

    await subtitle.update({ status: EditStatus.PROCESSING });

    const video = await Video.findByPk(subtitle.videoId);
    if (!video) {
      throw new Error(`Video with ID ${subtitle.videoId} not found`);
    }

    const outputDir = process.env.OUTPUT_DIR || 'outputs';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const srtPath = path.join(outputDir, `${subtitle.id}.srt`);
    const srtContent = `1\n${formatTime(subtitle.startTime)} --> ${formatTime(subtitle.endTime)}\n${subtitle.text}\n`;
    fs.writeFileSync(srtPath, srtContent);

    const outputPath = path.join(outputDir, `${video.id}_subtitle_${subtitle.id}.mp4`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(video.filePath)
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

    await subtitle.update({
      outputPath,
      status: EditStatus.COMPLETED
    });
  } catch (error) {
    console.error(`Error processing subtitle ${subtitleId}:`, error);
    await Subtitle.update(
      { status: EditStatus.FAILED },
      { where: { id: subtitleId } }
    );
    throw error;
  }
};

export const processRender = async (job: Job): Promise<void> => {
  const { videoId, edits } = job.data;
  
  try {
    console.log(`Processing render job ${job.id}`);
    
    if (!isValidUUID(videoId)) {
      throw new Error(`Invalid video ID format: ${videoId}`);
    }
    
    const video = await Video.findByPk(videoId);
    if (!video) {
      throw new Error(`Video with ID ${videoId} not found`);
    }

    const outputDir = process.env.OUTPUT_DIR || 'outputs';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, `${video.id}_rendered.mp4`);

    interface EditInput {
      type: string;
      path: string;
      id: string;
    }
    
    const validInputs: EditInput[] = [];
    
    for (let i = 0; i < edits.length; i++) {
      const edit = edits[i];
      
      if (!isValidUUID(edit.id)) {
        console.warn(`Invalid ${edit.type} ID format: ${edit.id}, skipping this edit`);
        continue;
      }
      
      if (edit.type === 'trim') {
        const trimId = edit.id;
        console.log(`Looking for trim with ID: ${trimId}`);
        const trim = await Trim.findByPk(trimId);
        if (trim && trim.outputPath) {
          validInputs.push({
            type: 'trim',
            path: trim.outputPath,
            id: trimId
          });
        } else {
          console.warn(`Trim with ID ${trimId} not found or has no output path`);
        }
      } else if (edit.type === 'subtitle') {
        const subtitleId = edit.id;
        console.log(`Looking for subtitle with ID: ${subtitleId}`);
        const subtitle = await Subtitle.findByPk(subtitleId);
        if (subtitle && subtitle.outputPath) {
          validInputs.push({
            type: 'subtitle',
            path: subtitle.outputPath,
            id: subtitleId
          });
        } else {
          console.warn(`Subtitle with ID ${subtitleId} not found or has no output path`);
        }
      }
    }
    
    if (validInputs.length === 0) {
      console.log('No valid edits found, using original video');
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(video.filePath)
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
      
      await new Promise<void>((resolve, reject) => {
        ffmpeg(validInputs[0].path)
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
        
        await new Promise<void>((resolve, reject) => {
          ffmpeg(trimInput.path)
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
        
        await new Promise<void>((resolve, reject) => {
          ffmpeg(subtitleInput.path)
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
        
        const subtitle = await Subtitle.findByPk(subtitleInput.id);
        
        if (!subtitle) {
          throw new Error(`Subtitle with ID ${subtitleInput.id} not found`);
        }
        
        const srtFilePath = path.join(outputDir, `${video.id}_subtitle.srt`);
        
        const srtContent = `1\n${formatTime(subtitle.startTime)} --> ${formatTime(subtitle.endTime)}\n${subtitle.text}\n`;
        
        console.log(`Creating SRT file at ${srtFilePath} with content:`);
        console.log(srtContent);
        
        fs.writeFileSync(srtFilePath, srtContent);
        
        try {
          await new Promise<void>((resolve, reject) => {
            ffmpeg(trimInput.path)
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
        } finally {
          if (fs.existsSync(srtFilePath)) {
            fs.unlinkSync(srtFilePath);
            console.log(`Deleted temporary SRT file: ${srtFilePath}`);
          }
        }
      }
      else {
        throw new Error(`Unexpected combination of edits: ${validInputs.length} total, ${trimInputs.length} trims, ${subtitleInputs.length} subtitles`);
      }
    }
    
    await video.update({
      renderedPath: outputPath
    });
    
    console.log(`Video ${videoId} rendered successfully`);
  } catch (error) {
    console.error(`Error rendering video ${videoId}:`, error);
    throw error;
  }
};

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

function isValidUUID(uuid: string): boolean {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
}
