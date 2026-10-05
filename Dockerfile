# Build Stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and compile
COPY . .
RUN npm run build

# Production Runner Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5050

# Create app user for container security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 expressjs

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --only=production && npx prisma generate

# Copy built code from builder
COPY --from=builder /app/dist ./dist

# Create logs directory with correct permissions
RUN mkdir -p logs && chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 5050

CMD ["node", "dist/server.js"]
