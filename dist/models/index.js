"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeModels = exports.Subtitle = exports.Trim = exports.Video = exports.sequelize = void 0;
const database_1 = require("../config/database");
Object.defineProperty(exports, "sequelize", { enumerable: true, get: function () { return database_1.sequelize; } });
const video_model_1 = require("./video.model");
Object.defineProperty(exports, "Video", { enumerable: true, get: function () { return video_model_1.Video; } });
const trim_model_1 = require("./trim.model");
Object.defineProperty(exports, "Trim", { enumerable: true, get: function () { return trim_model_1.Trim; } });
const subtitle_model_1 = require("./subtitle.model");
Object.defineProperty(exports, "Subtitle", { enumerable: true, get: function () { return subtitle_model_1.Subtitle; } });
video_model_1.Video.hasMany(trim_model_1.Trim, { foreignKey: 'videoId', as: 'trims' });
trim_model_1.Trim.belongsTo(video_model_1.Video, { foreignKey: 'videoId' });
video_model_1.Video.hasMany(subtitle_model_1.Subtitle, { foreignKey: 'videoId', as: 'subtitles' });
subtitle_model_1.Subtitle.belongsTo(video_model_1.Video, { foreignKey: 'videoId' });
const initializeModels = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield database_1.sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
        console.log('Models synchronized successfully');
    }
    catch (error) {
        console.error('Failed to synchronize models:', error);
        process.exit(1);
    }
});
exports.initializeModels = initializeModels;
