"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subtitle = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
const trim_model_1 = require("./trim.model");
class Subtitle extends sequelize_1.Model {
}
exports.Subtitle = Subtitle;
Subtitle.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    videoId: {
        type: sequelize_1.DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'videos',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    text: {
        type: sequelize_1.DataTypes.TEXT,
        allowNull: false
    },
    startTime: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    endTime: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: false
    },
    outputPath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(trim_model_1.EditStatus)),
        allowNull: false,
        defaultValue: trim_model_1.EditStatus.PENDING
    },
    createdAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    },
    updatedAt: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize_1.DataTypes.NOW
    }
}, {
    sequelize: database_1.sequelize,
    modelName: 'Subtitle',
    tableName: 'subtitles',
    timestamps: true
});
