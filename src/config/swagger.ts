import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',

    info: {
      title: 'Mr. Wilson API',
      version: '1.0.0',
      description: 'Production API documentation for Mr. Wilson platform',
    },

    servers: [
      {
        url:
          env.NODE_ENV === 'production'
            ? 'https://joe-wilson-api-production.up.railway.app'
            : `http://localhost:${env.PORT}`,
      },
    ],

    tags: [
      { name: 'Auth' },
      { name: 'Services' },
      { name: 'Events' },
      { name: 'Testimonials' },
      { name: 'Settings' },
      { name: 'Inquiries' },
      { name: 'Quotes' },
      { name: 'Masterclasses' },
      { name: 'Sessions' },
      { name: 'Enrollments' },
      { name: 'Payments' },
      { name: 'Admin' },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },

      schemas: {
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
          },
        },

        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
      },
    },

    security: [{ bearerAuth: [] }],

    paths: {
      // ─────────────────────────────────────────────
      // HEALTH
      // ─────────────────────────────────────────────
      '/health': {
        get: {
          summary: 'Health check',
          tags: ['Admin'],
          responses: {
            200: {
              description: 'API is healthy',
            },
          },
        },
      },

      // ─────────────────────────────────────────────
      // AUTH
      // ─────────────────────────────────────────────
      '/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'User registered' },
          },
        },
      },

      '/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login user',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            200: { description: 'Login successful' },
          },
        },
      },

      '/v1/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset',
          responses: {
            200: { description: 'Reset email sent' },
          },
        },
      },

      '/v1/auth/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Reset password',
          responses: {
            200: { description: 'Password reset successful' },
          },
        },
      },

      // ─────────────────────────────────────────────
      // SERVICES
      // ─────────────────────────────────────────────
      '/v1/services': {
        get: {
          tags: ['Services'],
          summary: 'Get all services',
          responses: {
            200: { description: 'List of services' },
          },
        },
      },

      // ─────────────────────────────────────────────
      // EVENTS
      // ─────────────────────────────────────────────
      '/v1/events': {
        get: {
          tags: ['Events'],
          summary: 'Get all events',
          responses: {
            200: { description: 'List of events' },
          },
        },
      },

      // ─────────────────────────────────────────────
      // TESTIMONIALS
      // ─────────────────────────────────────────────
      '/v1/testimonials': {
        get: {
          tags: ['Testimonials'],
          summary: 'Get testimonials',
          responses: {
            200: { description: 'Testimonials list' },
          },
        },
      },

      // ─────────────────────────────────────────────
      // MASTERCLASSES
      // ─────────────────────────────────────────────
      '/v1/masterclasses': {
        get: {
          tags: ['Masterclasses'],
          summary: 'Get masterclasses',
          responses: {
            200: { description: 'List of masterclasses' },
          },
        },
      },

      // ─────────────────────────────────────────────
      // PAYMENTS
      // ─────────────────────────────────────────────
      '/v1/payments': {
        get: {
          tags: ['Payments'],
          summary: 'Get payments',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Payments list' },
          },
        },
      },

      // ─────────────────────────────────────────────
      // ADMIN DASHBOARD
      // ─────────────────────────────────────────────
      '/v1/admin/dashboard': {
        get: {
          tags: ['Admin'],
          summary: 'Admin dashboard',
          security: [{ bearerAuth: [] }],
          responses: {
            200: { description: 'Dashboard data' },
          },
        },
      },
    },
  },

  apis: [], // 👈 disable scanning (we control everything manually)
};

export const swaggerSpec = swaggerJsdoc(options);