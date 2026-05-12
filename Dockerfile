# ─────────────────────────────────────────────
# BUILD STAGE
# ─────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Generate Prisma client + build TS
RUN npx prisma generate
RUN npm run build

# ─────────────────────────────────────────────
# PRODUCTION STAGE
# ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# ✅ FIX: Install OpenSSL (required by Prisma)
RUN apk add --no-cache openssl

# Copy only necessary files
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port
EXPOSE 3000

# Start app (migrations + server)
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]