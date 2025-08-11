# Production Dockerfile for MERN Stack
# Build stage for client
FROM node:22-alpine AS client-build

WORKDIR /app/client

# Copy client package files
COPY client/package*.json ./
RUN npm ci --only=production

# Copy client source
COPY client/ ./

# Build client for production
RUN npm run build

# Build stage for server
FROM node:22-alpine AS server-build

WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./
RUN npm ci --only=production

# Copy server source
COPY server/ ./

# Production stage
FROM node:22-alpine AS production

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S mernapp -u 1001

# Set working directory
WORKDIR /app

# Copy server files
COPY --from=server-build --chown=mernapp:nodejs /app/server ./server
COPY --from=client-build --chown=mernapp:nodejs /app/client/dist ./client/dist

# Create logs directory
RUN mkdir -p /app/server/logs && \
    chown -R mernapp:nodejs /app/server/logs

# Switch to non-root user
USER mernapp

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Expose port
EXPOSE 5000

# Start the application
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server/src/index.js"]