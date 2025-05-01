import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum VideoStatus {
  UPLOADED = 'UPLOADED',
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED'
}

interface VideoAttributes {
  id: string;
  title: string;
  originalFilename: string;
  filePath: string;
  thumbnailPath?: string;
  renderedPath?: string;
  duration?: number;
  status: VideoStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface VideoCreationAttributes extends Optional<VideoAttributes, 'id' | 'createdAt' | 'updatedAt' | 'thumbnailPath' | 'renderedPath' | 'duration'> {}

export class Video extends Model<VideoAttributes, VideoCreationAttributes> implements VideoAttributes {
  public id!: string;
  public title!: string;
  public originalFilename!: string;
  public filePath!: string;
  public thumbnailPath!: string | undefined;
  public renderedPath!: string | undefined;
  public duration!: number | undefined;
  public status!: VideoStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Video.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    originalFilename: {
      type: DataTypes.STRING,
      allowNull: false
    },
    filePath: {
      type: DataTypes.STRING,
      allowNull: false
    },
    thumbnailPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    renderedPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    duration: {
      type: DataTypes.FLOAT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(VideoStatus)),
      allowNull: false,
      defaultValue: VideoStatus.UPLOADED
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  },
  {
    sequelize,
    modelName: 'Video',
    tableName: 'videos',
    timestamps: true
  }
);
