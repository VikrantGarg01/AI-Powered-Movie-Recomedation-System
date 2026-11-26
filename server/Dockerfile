# Node.js Express REST API Production Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package descriptors first for layer caching
COPY package*.json ./

# Install production dependencies only
RUN npm install --omit=dev

# Copy application source code (excluding .dockerignore files)
COPY . .

# Ensure uploads directory exists and is owned by non-root user 'node'
RUN mkdir -p uploads && chown -R node:node /app

# Security: Switch to unprivileged non-root user
USER node

EXPOSE 5001

CMD ["node", "server.js"]
