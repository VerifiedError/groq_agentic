# Multi-stage Dockerfile for Next.js 15 with Turbopack + Python MCP
# Stage 1: Dependencies
FROM node:20-alpine AS deps

# Install dependencies for native modules and Python
RUN apk add --no-cache libc6-compat python3 py3-pip

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install dependencies (use legacy-peer-deps for React 19 compatibility)
RUN npm ci --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder

# Install Python and pip
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Install Python dependencies for MCP server
RUN pip3 install --no-cache-dir fastmcp --break-system-packages

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js application with Turbopack
# Note: This is NOT a real secret - just a placeholder to satisfy Next.js build checks
# Real API keys are provided at runtime via docker-compose.yml or user settings
ARG GROQ_API_KEY_BUILD=gsk_build_time_placeholder_not_a_real_secret
ENV GROQ_API_KEY=${GROQ_API_KEY_BUILD}
RUN npm run build
# Clear the placeholder after build
ENV GROQ_API_KEY=

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner

# Install Python and pip for MCP server
RUN apk add --no-cache python3 py3-pip

WORKDIR /app

# Set environment to production
ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Install Python dependencies for MCP server
RUN pip3 install --no-cache-dir fastmcp --break-system-packages

# Copy necessary files from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files for migrations and client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copy MCP server files
COPY --from=builder /app/mcp_servers ./mcp_servers

# Copy package.json for Next.js to read dependencies metadata
COPY --from=builder /app/package.json ./package.json

# Create data directory for SQLite database and artifact workspaces
RUN mkdir -p /app/data /app/artifact_workspaces && \
    chown -R nextjs:nodejs /app/data /app/artifact_workspaces

# Set user
USER nextjs

# Expose port 13380
EXPOSE 13380

# Set port environment variable
ENV PORT=13380
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:13380/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Run migrations and start server
# Use JSON format to properly handle OS signals (SIGTERM, SIGINT)
CMD ["sh", "-c", "npx prisma migrate deploy && node server.js"]
