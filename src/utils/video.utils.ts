import ffmpeg from 'fluent-ffmpeg';
import { promisify } from 'util';

/**
 * Get the duration of a video file in seconds
 * @param filePath Path to the video file
 * @returns Promise that resolves to the duration in seconds
 */
export const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      // Get duration from metadata
      const duration = metadata.format.duration || 0;
      resolve(duration);
    });
  });
};

/**
 * Get video metadata including width, height, codec, etc.
 * @param filePath Path to the video file
 * @returns Promise that resolves to the video metadata
 */
export const getVideoMetadata = (filePath: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        return reject(err);
      }
      
      resolve(metadata);
    });
  });
};

/**
 * Check if FFmpeg is installed and accessible
 * @returns Promise that resolves to true if FFmpeg is available
 */
export const checkFfmpegAvailability = (): Promise<boolean> => {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((err) => {
      if (err) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

/**
 * Generate a thumbnail from a video at a specific time
 * @param videoPath Path to the video file
 * @param outputPath Path to save the thumbnail
 * @param timeInSeconds Time in seconds to capture the thumbnail
 * @returns Promise that resolves when the thumbnail is generated
 */
export const generateThumbnail = (
  videoPath: string,
  outputPath: string,
  timeInSeconds: number = 0
): Promise<void> => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
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
