# ── Worker / Runner-Agent Dockerfile ─────────────────────────────────────────
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production --ignore-scripts

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM node:18-alpine

# Install Docker CLI + git (needed for repo cloning)
RUN apk add --no-cache docker-cli git

WORKDIR /app

# Copy production node_modules
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY . .

# Temp build dirs — worker writes here during deployments
RUN mkdir -p /tmp/msd-builds /tmp/msd-envfiles && chmod 700 /tmp/msd-envfiles

EXPOSE 4000

HEALTHCHECK --interval=15s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4000/health',(r)=>{process.exit(r.statusCode===200?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "index.js"]
