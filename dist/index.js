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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const yamljs_1 = __importDefault(require("yamljs"));
const video_routes_1 = __importDefault(require("./routes/video.routes"));
const error_middleware_1 = require("./middlewares/error.middleware");
const database_1 = require("./config/database");
const models_1 = require("./models");
const queue_worker_1 = require("./workers/queue.worker");
dotenv_1.default.config();
const swaggerFilePath = path_1.default.resolve(process.cwd(), 'swagger.yaml');
console.log(`Loading Swagger file from: ${swaggerFilePath}`);
const swaggerDocument = yamljs_1.default.load(swaggerFilePath);
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const outputDir = process.env.OUTPUT_DIR || 'outputs';
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
if (!fs_1.default.existsSync(outputDir)) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
}
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '..', uploadDir)));
app.use('/outputs', express_1.default.static(path_1.default.join(__dirname, '..', outputDir)));
app.use('/api/videos', video_routes_1.default);
app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(swaggerDocument));
app.use(error_middleware_1.errorHandler);
const startServer = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield (0, database_1.connectToDatabase)();
        yield (0, models_1.initializeModels)();
        (0, queue_worker_1.startQueueWorkers)();
        (0, queue_worker_1.setupQueueMonitoring)();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
});
startServer();
