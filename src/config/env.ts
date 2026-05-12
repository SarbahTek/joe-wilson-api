import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // ── Database ──────────────────────────────────────────────────────────────
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // ── JWT — minimum 32 chars, must differ from each other ──────────────────
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters — generate with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),

  // ── Server ────────────────────────────────────────────────────────────────
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production']),

  // Comma-separated list of allowed origins, e.g. "https://mrwilson.com,https://www.mrwilson.com"
  FRONTEND_URLS: z.string().default('http://localhost:3000'),

  // ── Swagger docs protection (optional token for /docs in production) ──────
  DOCS_TOKEN: z.string().optional(),

  // ── Stripe ────────────────────────────────────────────────────────────────
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // ── S3 / R2 ───────────────────────────────────────────────────────────────
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_ENDPOINT: z.string().optional(),

  // ── Mux ───────────────────────────────────────────────────────────────────
  MUX_TOKEN_ID: z.string().optional(),
  MUX_TOKEN_SECRET: z.string().optional(),
  MUX_SIGNING_KEY_ID: z.string().optional(),
  MUX_SIGNING_PRIVATE_KEY: z.string().optional(),

  // ── Email ─────────────────────────────────────────────────────────────────
  RESEND_API_KEY: z.string().optional(),
  RESEND_FROM_EMAIL: z.string().default('noreply@mrwilson.com'),
  ADMIN_EMAIL: z.string().default('joseph@mrwilson.com'),

  // ── Redis — must be a rediss:// or redis:// URL, NOT a CLI command ────────
  REDIS_URL: z.string().default('redis://localhost:6379'),
}).refine(
  (data) => data.JWT_SECRET !== data.JWT_REFRESH_SECRET,
  { message: 'JWT_SECRET and JWT_REFRESH_SECRET must be different values', path: ['JWT_REFRESH_SECRET'] }
);

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

export const env = parsed.data;
