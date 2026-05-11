# Mr. Wilson Platform — Backend API

This is the backend for the Mr. Wilson music artist and masterclass platform. I built this as a REST API that serves three different surfaces — the public website, the member portal where students access their courses, and the admin dashboard where Joseph manages everything.

It took a while to figure out the right structure for this but I eventually settled on a module-based approach where each feature lives in its own folder with its own routes, controller, and logic. Makes it a lot easier to find things and add new features without breaking what already works.


## What's Inside

The platform has three types of users and the backend handles all of them differently:

- **Public visitors** can browse services, events, testimonials, and submit contact or booking requests — no login needed
- **Members** can access masterclasses they've paid for, watch video lessons, track their progress, and download resources
- **The owner (Joseph)** has a full admin panel to manage everything — students, payments, content, media, inquiries, and site settings


## Tech Choices and Why

I went back and forth on a few of these so worth explaining my thinking:

**Node.js + TypeScript** — TypeScript saved me several times during development. The type checking catches mistakes before they become runtime errors which on a payment platform is exactly what you want.

**Express.js** — Considered NestJS but it felt like too much structure for the size of this project. Express gives you full control and the ecosystem is massive when you need to look something up.

**PostgreSQL + Prisma** — The data here is highly relational. Enrollments need payments, payments need users, sessions need masterclasses. A relational database enforces all of that at the database level rather than in application code. Prisma handles migrations cleanly and the type-safe queries are a big productivity boost.

**JWT with refresh token rotation** — Went with a two-token system. Short-lived access tokens (15 minutes) and longer-lived refresh tokens (30 days) stored in the database as hashed values. If a refresh token is used twice it invalidates the whole session — basic replay attack protection.

**Cloudflare R2 / AWS S3** — Files can't live on the server itself. R2 was the recommendation here because there are no egress fees which matters when students are downloading PDFs and audio files repeatedly.

**Redis (Upstash)** — Used for rate limiting on auth routes and caching public endpoints. Upstash made sense because it's serverless and doesn't need a separate managed instance to worry about.



## Project Layout

mr-wilson-api/
├── src/
│   ├── config/          # Database, Redis, S3 connections + env validation
│   ├── middleware/       # Auth guards, admin guard, enrollment check, error handler
│   ├── modules/         # One folder per feature
│   │   ├── auth/
│   │   ├── masterclasses/
│   │   ├── sessions/
│   │   ├── enrollments/
│   │   ├── payments/
│   │   ├── media/
│   │   ├── inquiries/
│   │   ├── quotes/
│   │   ├── services/
│   │   ├── events/
│   │   ├── testimonials/
│   │   ├── settings/
│   │   ├── users/
│   │   └── dashboard/
│   ├── utils/           # JWT, email, pagination, response helpers, signed URLs
│   └── app.ts           # Entry point
├── prisma/
│   ├── schema.prisma    # All 14 tables
│   └── seed.ts          # Sample data
├── .env.example
├── docker-compose.yml
└── package.json


## Getting Started

### Requirements
- Node.js 20+
- Docker Desktop (for local PostgreSQL and Redis) OR free accounts on Neon and Upstash

### 1. Install dependencies

```bash
npm install
```


### 2. Set up environment variables

```bash

copy .env.example .env


Open `.env` and fill in the required values. At minimum you need:

```env
DATABASE_URL=        # PostgreSQL connection string
JWT_SECRET=          # Random 64-char string (see below)
JWT_REFRESH_SECRET=  # Different random 64-char string
```

To generate the JWT secrets run this and use the output (run it twice for two different values):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 3. Start the database

**With Docker:**
```bash
docker-compose up -d
```

**Without Docker (recommended for Windows):**
- PostgreSQL → create a free database at neon.tech, copy the connection string
- Redis → create a free database at upstash.com, copy the Redis URL

Paste both into your `.env` file.

### 4. Run migrations

```bash
npm run db:migrate
```

When prompted for a migration name type `init`.

### 5. Seed sample data

```bash
npm run db:seed
```

This creates two accounts you can use straight away:
- **Owner:** `joseph@mrwilson.com` / `Admin@123456`
- **Member:** `test@member.com` / `Member@123456`

### 6. Start the server

```bash
npm run dev
```

Server runs at `http://localhost:3001`

Quick check — open this in your browser:
```
http://localhost:3001/health
```

Should return `{ "status": "ok" }`. If it does everything is working.

---

## API Overview

Base URL: `http://localhost:3001/v1`

Every response follows the same format:
```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 50 }
}
```

### Auth
```
POST   /v1/auth/register
POST   /v1/auth/login
POST   /v1/auth/refresh
POST   /v1/auth/logout
POST   /v1/auth/forgot-password
POST   /v1/auth/reset-password
GET    /v1/auth/me
PATCH  /v1/auth/me
```

### Public (no login required)
```
GET    /v1/services
GET    /v1/services/:slug
GET    /v1/events
GET    /v1/testimonials
GET    /v1/settings/public
POST   /v1/inquiries
POST   /v1/quotes
```

### Member (login required)
```
GET    /v1/masterclasses
GET    /v1/masterclasses/:id
GET    /v1/sessions/:id
POST   /v1/sessions/:id/progress
GET    /v1/enrollments/my
POST   /v1/payments/checkout
GET    /v1/payments/my
```

### Admin (owner only)
```
GET    /v1/admin/dashboard
GET    /v1/admin/masterclasses
POST   /v1/admin/masterclasses
PATCH  /v1/admin/masterclasses/:id
POST   /v1/admin/masterclasses/:id/sessions
GET    /v1/admin/users
GET    /v1/admin/payments
GET    /v1/admin/payments/export/csv
POST   /v1/admin/payments/:id/refund
GET    /v1/admin/media
POST   /v1/admin/media/upload
GET    /v1/inquiries
POST   /v1/inquiries/:id/reply
GET    /v1/admin/quotes
PATCH  /v1/admin/quotes/:id/status
```

---

## Things Still Needed

A few integrations are built and ready but need credentials before they go live:

**Payments**

The checkout and webhook logic is written and sitting in `src/modules/payments/payments.controller.ts` — it just needs a payment provider decision. Once that's done:

1. Add `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` to `.env`
2. Uncomment the Stripe code in `createCheckout()` and `stripeWebhook()`
3. Test with Stripe CLI: `stripe listen --forward-to localhost:3001/v1/payments/webhook`

**Video Streaming (Mux)**

Session video delivery is designed around Mux. Once the account is set up:

1. Add `MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`, `MUX_SIGNING_KEY_ID`, `MUX_SIGNING_PRIVATE_KEY` to `.env`
2. Uncomment the Mux token generation in `src/modules/sessions/sessions.controller.ts`

**File Storage (S3 or R2)**

1. Create a bucket and get credentials
2. Add `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` to `.env`
3. File uploads work automatically after that

**Email (Resend)**

1. Create account at resend.com
2. Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env`

---

## Deployment

The easiest path to production is Railway:

1. Push to GitHub
2. Create a new project on Railway and connect the repo
3. Add PostgreSQL and Redis from the Railway plugin marketplace
4. Copy all environment variables into Railway's environment settings
5. Run `npm run db:deploy` to apply migrations on the production database
6. Railway handles SSL and deploys automatically on every push

---

## Available Scripts

```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Run compiled production build
npm run db:migrate   # Create and apply a new migration
npm run db:deploy    # Apply pending migrations (use this in production)
npm run db:seed      # Seed the database with sample data
npm run db:studio    # Open Prisma Studio — visual database browser
npm run db:generate  # Regenerate Prisma client after schema changes
```

---

## Notes

A few things worth knowing if you're picking this up:

- The Stripe webhook route uses `express.raw()` not `express.json()` — this is intentional. Stripe needs the raw request body to verify the signature. Changing it will break webhook verification.
- Storage keys from S3 are never returned in API responses. Only presigned URLs with 15-minute expiry are sent to clients. Don't change this behaviour.
- Enrollment is only ever created by the payment webhook, never by a direct API call. This is a security decision — the frontend confirming payment is not sufficient.
- The owner account is seeded with role `owner`. There is no endpoint to promote a user to owner — this has to be done directly in the database or by updating the seed.
