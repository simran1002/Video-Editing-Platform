import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import videoRoutes from './routes/video.routes';
import { errorHandler } from './middlewares/error.middleware';
import { connectToDatabase } from './config/database';
import { initializeModels } from './models';
import { startQueueWorkers, setupQueueMonitoring } from './workers/queue.worker';

dotenv.config();

const swaggerFilePath = path.resolve(process.cwd(), 'swagger.yaml');
console.log(`Loading Swagger file from: ${swaggerFilePath}`);
const swaggerDocument = YAML.load(swaggerFilePath);

const app = express();
const PORT = process.env.PORT || 3000;

const uploadDir = process.env.UPLOAD_DIR || 'uploads';
const outputDir = process.env.OUTPUT_DIR || 'outputs';

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/uploads', express.static(path.join(__dirname, '..', uploadDir)));
app.use('/outputs', express.static(path.join(__dirname, '..', outputDir)));

app.use('/api/videos', videoRoutes);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(errorHandler);

const startServer = async () => {
  try {
    await connectToDatabase();
    
    await initializeModels();
    
    startQueueWorkers();
    
    setupQueueMonitoring();
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
