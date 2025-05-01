import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../../package.json';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Video Editing Platform API',
      version,
      description: 'API documentation for the Video Editing Platform',
      license: {
        name: 'ISC',
      },
      contact: {
        name: 'API Support',
        email: 'support@videoediting.example.com',
      },
    },
    servers: [
      {
        url: '/',
        description: 'API Server',
      },
    ],
    components: {
      schemas: {
        Video: {
          type: 'object',
          required: ['id', 'title', 'originalFilename', 'filePath', 'status'],
          properties: {
            id: {
              type: 'string',
              description: 'The auto-generated id of the video',
            },
            title: {
              type: 'string',
              description: 'Title of the video',
            },
            originalFilename: {
              type: 'string',
              description: 'Original filename of the video',
            },
            filePath: {
              type: 'string',
              description: 'Path to the original video file',
            },
            renderedPath: {
              type: 'string',
              description: 'Path to the rendered video file',
              nullable: true,
            },
            thumbnailPath: {
              type: 'string',
              description: 'Path to the video thumbnail',
              nullable: true,
            },
            duration: {
              type: 'number',
              description: 'Duration of the video in seconds',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['UPLOADED', 'PROCESSING', 'READY', 'FAILED'],
              description: 'Current status of the video',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date-time when the video was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date-time when the video was last updated',
            },
          },
        },
        Trim: {
          type: 'object',
          required: ['id', 'startTime', 'endTime', 'videoId', 'status'],
          properties: {
            id: {
              type: 'string',
              description: 'The auto-generated id of the trim operation',
            },
            startTime: {
              type: 'number',
              description: 'Start time in seconds',
            },
            endTime: {
              type: 'number',
              description: 'End time in seconds',
            },
            outputPath: {
              type: 'string',
              description: 'Path to the trimmed video file',
              nullable: true,
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
              description: 'Current status of the trim operation',
            },
            videoId: {
              type: 'string',
              description: 'ID of the video being trimmed',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date-time when the trim operation was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date-time when the trim operation was last updated',
            },
          },
        },
        Subtitle: {
          type: 'object',
          required: ['id', 'text', 'startTime', 'endTime', 'videoId', 'status'],
          properties: {
            id: {
              type: 'string',
              description: 'The auto-generated id of the subtitle',
            },
            text: {
              type: 'string',
              description: 'The subtitle text',
            },
            startTime: {
              type: 'number',
              description: 'Start time in seconds',
            },
            endTime: {
              type: 'number',
              description: 'End time in seconds',
            },
            status: {
              type: 'string',
              enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED'],
              description: 'Current status of the subtitle',
            },
            videoId: {
              type: 'string',
              description: 'ID of the video for this subtitle',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date-time when the subtitle was created',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              description: 'The date-time when the subtitle was last updated',
            },
          },
        },
        Error: {
          type: 'object',
          required: ['error'],
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
