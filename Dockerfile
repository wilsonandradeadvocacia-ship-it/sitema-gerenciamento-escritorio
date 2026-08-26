# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS base

# LibreOffice (PDF export for generated documents) + gcc (harmless sandbox
# socket-shim compile in src/lib/soffice.ts, no-op on a normal host) + fonts
# so generated PDFs render Latin/accented characters correctly.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice \
    gcc \
    libc6-dev \
    fonts-liberation \
    fonts-dejavu \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# DATABASE_URL only needs to be valid at build time for `prisma generate`
# (no DB connection is made); the real value is provided at runtime.
ENV DATABASE_URL="file:./build.db"
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

RUN chmod +x docker-entrypoint.sh
ENTRYPOINT ["./docker-entrypoint.sh"]
