import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export enum EditStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

interface TrimAttributes {
  id: string;
  videoId: string;
  startTime: number;
  endTime: number;
  outputPath?: string;
  status: EditStatus;
  createdAt: Date;
  updatedAt: Date;
}

interface TrimCreationAttributes extends Optional<TrimAttributes, 'id' | 'createdAt' | 'updatedAt' | 'outputPath'> {}

export class Trim extends Model<TrimAttributes, TrimCreationAttributes> implements TrimAttributes {
  public id!: string;
  public videoId!: string;
  public startTime!: number;
  public endTime!: number;
  public outputPath!: string | undefined;
  public status!: EditStatus;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Trim.init(
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
    modelName: 'Trim',
    tableName: 'trims',
    timestamps: true
  }
);
