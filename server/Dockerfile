# ── Backend Dockerfile ────────────────────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM node:18-alpine
WORKDIR /app

# Create non-root user
RUN addgroup -S clouddeck && adduser -S clouddeck -G clouddeck

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Create log directory
RUN mkdir -p /var/log/clouddeck && chown -R clouddeck:clouddeck /var/log/clouddeck /app

USER clouddeck

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "index.js"]
