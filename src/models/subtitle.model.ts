import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { EditStatus } from './trim.model';

interface SubtitleAttributes {
  id: string;
  videoId: string;
  text: string;
  startTime: number;
  endTime: number;
  outputPath?: string;
  status: EditStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface SubtitleCreationAttributes extends Optional<SubtitleAttributes, 'id' | 'createdAt' | 'updatedAt' | 'outputPath'> {}

export class Subtitle extends Model<SubtitleAttributes, SubtitleCreationAttributes> implements SubtitleAttributes {
  public id!: string;
  public videoId!: string;
  public text!: string;
  public startTime!: number;
  public endTime!: number;
  public outputPath!: string | undefined;
  public status!: EditStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Subtitle.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    videoId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'videos',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    startTime: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    endTime: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    outputPath: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM(...Object.values(EditStatus)),
      allowNull: false,
      defaultValue: EditStatus.PENDING
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
    modelName: 'Subtitle',
    tableName: 'subtitles',
    timestamps: true
  }
);
