# Multi-stage build for frontend
FROM node:18-alpine AS frontend-builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install
COPY . .
RUN pnpm run build

# Backend container
FROM node:18-alpine AS backend
WORKDIR /server
COPY server/package.json server/pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --production

# Production runtime
FROM node:18-alpine
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

# Copy built frontend
COPY --from=frontend-builder /app/.next /app/.next
COPY --from=frontend-builder /app/public /app/public
COPY --from=frontend-builder /app/node_modules /app/node_modules
COPY --from=frontend-builder /app/package.json /app/

# Copy backend
COPY --from=backend /server/node_modules /app/server/node_modules
COPY server /app/server

# Copy env template
COPY .env.example /app/.env.production

# Set ownership
RUN chown -R nodejs:nodejs /app

USER nodejs

# Set environment variables for production
ENV PORT=5000 \
    NODE_ENV=production \
    NEXT_PUBLIC_API_URL=${API_URL}

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 5000

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]

# Start backend server (primary service)
CMD ["node", "/app/server/index.js"]
