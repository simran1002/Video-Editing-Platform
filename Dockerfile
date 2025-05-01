FROM node:18-slim AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-slim

# Install FFmpeg, PostgreSQL client and Redis CLI for healthchecks
RUN apt-get update && \
    apt-get install -y ffmpeg postgresql-client redis-tools && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm install --only=production

# Copy entrypoint script
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Copy Swagger YAML file
COPY swagger.yaml ./swagger.yaml

# Copy built app from builder stage
COPY --from=builder /app/dist ./dist

# Create directories for uploads and outputs
RUN mkdir -p uploads outputs

# Expose port
EXPOSE 3000

# Start command
CMD ["./docker-entrypoint.sh"]
