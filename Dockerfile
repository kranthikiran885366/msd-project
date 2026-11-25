# ── Frontend Dockerfile (Next.js) ────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app


# Copy manifests first for layer caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Build args injected at build time so Next.js bakes them in
ARG NEXT_PUBLIC_API_URL=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=false
ENV NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS=$NEXT_PUBLIC_ENABLE_VERCEL_ANALYTICS
ARG INTERNAL_BACKEND_URL=http://backend:3001
ENV INTERNAL_BACKEND_URL=$INTERNAL_BACKEND_URL

RUN npm run build

# ── Runtime image ─────────────────────────────────────────────────────────────
FROM node:22-alpine
WORKDIR /app

RUN addgroup -S clouddeck && adduser -S clouddeck -G clouddeck

# Next.js standalone output bundles everything needed
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

RUN chown -R clouddeck:clouddeck /app
USER clouddeck

ENV PORT=3000
ENV HOSTNAME=0.0.0.0

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000',(r)=>{process.exit(r.statusCode<500?0:1)}).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
