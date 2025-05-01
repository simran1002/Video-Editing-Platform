"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Video = exports.VideoStatus = void 0;
const sequelize_1 = require("sequelize");
const database_1 = require("../config/database");
var VideoStatus;
(function (VideoStatus) {
    VideoStatus["UPLOADED"] = "UPLOADED";
    VideoStatus["PROCESSING"] = "PROCESSING";
    VideoStatus["READY"] = "READY";
    VideoStatus["FAILED"] = "FAILED";
})(VideoStatus || (exports.VideoStatus = VideoStatus = {}));
class Video extends sequelize_1.Model {
}
exports.Video = Video;
Video.init({
    id: {
        type: sequelize_1.DataTypes.UUID,
        defaultValue: sequelize_1.DataTypes.UUIDV4,
        primaryKey: true
    },
    title: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    originalFilename: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    filePath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false
    },
    thumbnailPath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    renderedPath: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: true
    },
    duration: {
        type: sequelize_1.DataTypes.FLOAT,
        allowNull: true
    },
    status: {
        type: sequelize_1.DataTypes.ENUM(...Object.values(VideoStatus)),
        allowNull: false,
        defaultValue: VideoStatus.UPLOADED
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
    modelName: 'Video',
    tableName: 'videos',
    timestamps: true
});
