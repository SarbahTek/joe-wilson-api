# ─────────────────────────────────────────────
# PRODUCTION STAGE
# ─────────────────────────────────────────────
FROM node:20-alpine

WORKDIR /app

# ✅ REQUIRED for Prisma
RUN apk add --no-cache openssl

# Copy build artifacts
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/app.js"]