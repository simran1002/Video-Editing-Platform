import { sequelize } from '../config/database';
import { Video } from './video.model';
import { Trim } from './trim.model';
import { Subtitle } from './subtitle.model';
Video.hasMany(Trim, { foreignKey: 'videoId', as: 'trims' });
Trim.belongsTo(Video, { foreignKey: 'videoId' });

Video.hasMany(Subtitle, { foreignKey: 'videoId', as: 'subtitles' });
Subtitle.belongsTo(Video, { foreignKey: 'videoId' });

const initializeModels = async (): Promise<void> => {
  try {
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('Models synchronized successfully');
  } catch (error) {
    console.error('Failed to synchronize models:', error);
    process.exit(1);
  }
};

export {
  sequelize,
  Video,
  Trim,
  Subtitle,
  initializeModels
};
