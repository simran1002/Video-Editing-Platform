# Video Editing Platform Backend

A scalable and modular backend service for a web-based video editing platform. This service allows users to upload videos, apply editing operations (trimming, subtitle overlay), and download the rendered video.

## Features

* Video upload and storage
* Video trimming/cutting
* Add subtitles to videos
* Render final video with all edits applied
* Download rendered videos
* API documentation with Swagger UI

## Tech Stack

* Node.js
* Express.js
* TypeScript
* PostgreSQL (using Sequelize ORM)
* FFmpeg (via fluent-ffmpeg)
* Multer for file uploads
* Swagger for API documentation
* Redis for job queues

## Prerequisites

* Node.js (v14+)
* PostgreSQL
* FFmpeg installed and available in PATH
* Redis (for job queues)

## Installation

### Local Development Setup

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and update the configuration:

   ```bash
   cp .env.example .env
   ```

4. Build the project:

   ```bash
   npm run build
   ```

## Running the Application

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm run build
npm start
```

### Complete Setup with Docker (Recommended)

The easiest way to get started is using Docker, which handles all dependencies including FFmpeg, PostgreSQL, and Redis:

1. Clone the repository
2. Build and start the containers:

   ```bash
   docker-compose up -d
   ```

   This will:
   * Build the Node.js application with FFmpeg installed
   * Start a PostgreSQL database container
   * Start a Redis container for job queues
   * Mount volumes for persistent storage of videos and database data

3. Access the application at [http://localhost:3000](http://localhost:3000)
4. Access the API documentation at [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Docker Commands

```bash
docker-compose up -d

docker-compose down

docker-compose logs -f app

docker-compose up -d --build

npm run start-services 
npm run stop-services
npm run logs            
npm run rebuild         
```

## API Documentation

The API is documented using Swagger. When the application is running, you can access the interactive API documentation at:

```bash
http://localhost:3000/api-docs
```

This provides a user-friendly interface to:

 
* Explore all available endpoints
* View request/response schemas
* Test API endpoints directly from the browser
* Understand the data models and relationships


## Docker Deployment

This application can be run using Docker and Docker Compose, which simplifies setup and ensures consistency across environments.

### Prerequisites for Docker Deployment

* Docker
* Docker Compose

### Running with Docker Compose

1. Clone the repository
2. Build and start the containers:

   ```bash
   docker-compose up -d
   ```

   This will:
   * Build the Node.js application with FFmpeg installed
   * Start a PostgreSQL database container
   * Start a Redis container for job queues
   * Mount volumes for persistent storage of videos and database data

3. Access the application at [http://localhost:3000](http://localhost:3000)
4. Access the API documentation at [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

### Stopping the Docker Containers

```bash
docker-compose down
```

### Viewing Logs

```bash
docker-compose logs -f app
```

### Rebuilding After Changes

```bash
docker-compose up -d --build
```

## Convenience Scripts

The following npm scripts are available for easier management:

```bash
npm run start-services  
npm run stop-services   
npm run logs           
npm run rebuild         
```

## API Endpoints

### Upload a video

* **POST** `/api/videos/upload`
* Request: `multipart/form-data` with a `video` field
* Response: Video metadata

### Get video by ID

* **GET** `/api/videos/:id`
* Response: Video details with all edits

### Trim a video

* **POST** `/api/videos/:id/trim`
* Request body:

  ```json
  {
    "startTime": 10.5,
    "endTime": 20.5
  }
  ```

* Response: Trim operation details

### Add subtitles

* **POST** `/api/videos/:id/subtitles`
* Request body:

  ```json
  {
    "text": "This is a subtitle",
    "startTime": 5.0,
    "endTime": 8.0
  }
  ```

* Response: Subtitle details

### Render final video

* **POST** `/api/videos/:id/render`
* Response: Render operation status

### Download rendered video

* **GET** `/api/videos/:id/download`
* Response: Video file stream

## Project Structure

```bash
├── src/
│   ├── controllers/     
│   ├── middlewares/  
│   ├── models/         
│   ├── routes/      
│   ├── services/       
│   ├── utils/          
│   ├── config/         
│   └── index.ts         
├── uploads/            
├── outputs/             
├── Dockerfile          
├── docker-compose.yml  
└── package.json         
```

## License

ISC
