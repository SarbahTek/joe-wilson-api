# ─────────────────────────────────────────────
# Stage 1 — Build TypeScript
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ─────────────────────────────────────────────
# Stage 2 — Production image
# ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# Required for Prisma on Alpine
RUN apk add --no-cache openssl

# Reinstall only production dependencies (no devDependencies)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output and Prisma files from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

EXPOSE 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]
