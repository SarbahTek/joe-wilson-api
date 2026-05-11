import './config/env'; // Validate env vars first — crash early if missing
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

// Routes
import authRoutes from './modules/auth/auth.routes';
import masterclassRoutes from './modules/masterclasses/masterclasses.routes';
import adminMasterclassRoutes from './modules/masterclasses/admin.masterclasses.routes';
import sessionRoutes from './modules/sessions/sessions.routes';
import enrollmentRoutes from './modules/enrollments/enrollments.routes';
import paymentRoutes from './modules/payments/payments.routes';
import adminPaymentRoutes from './modules/payments/admin.payments.routes';
import inquiryRoutes from './modules/inquiries/inquiries.routes';
import quoteRoutes from './modules/quotes/quotes.routes';
import serviceRoutes from './modules/services/services.routes';
import eventRoutes from './modules/events/events.routes';
import testimonialRoutes from './modules/testimonials/testimonials.routes';
import settingsRoutes from './modules/settings/settings.routes';
import mediaRoutes from './modules/media/media.routes';
import userRoutes from './modules/users/users.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

const app = express();

// ── Security ────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
  })
);

// ── Body parsers ─────────────────────────────────────────────────────────────
// IMPORTANT: The Stripe webhook route needs raw body — it registers its OWN
// express.raw() parser inside payments.routes.ts BEFORE express.json() is applied.
app.use('/v1/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Public routes ─────────────────────────────────────────────────────────────
app.use('/v1/auth', authRoutes);
app.use('/v1/services', serviceRoutes);
app.use('/v1/events', eventRoutes);
app.use('/v1/testimonials', testimonialRoutes);
app.use('/v1/settings', settingsRoutes);
app.use('/v1/inquiries', inquiryRoutes);
app.use('/v1/quotes', quoteRoutes);

// ── Member routes ─────────────────────────────────────────────────────────────
app.use('/v1/masterclasses', masterclassRoutes);
app.use('/v1/sessions', sessionRoutes);
app.use('/v1/enrollments', enrollmentRoutes);
app.use('/v1/payments', paymentRoutes);

// ── Admin routes ──────────────────────────────────────────────────────────────
app.use('/v1/admin/dashboard', dashboardRoutes);
app.use('/v1/admin/masterclasses', adminMasterclassRoutes);
app.use('/v1/admin/payments', adminPaymentRoutes);
app.use('/v1/admin/users', userRoutes);
app.use('/v1/admin/media', mediaRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = parseInt(env.PORT, 10);
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║      Mr. Wilson API — Running            ║
  ║      http://localhost:${PORT}               ║
  ║      Environment: ${env.NODE_ENV.padEnd(12)}        ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
