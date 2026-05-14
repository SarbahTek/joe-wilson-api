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

RUN apk add --no-cache openssl

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY prisma ./prisma

# ✅ copy start script
COPY start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 8080

# ✅ ONLY ONE CMD
CMD ["sh", "./start.sh"]