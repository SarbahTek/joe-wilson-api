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

        description:
          env.NODE_ENV === 'production'
            ? 'Production Server'
            : 'Development Server',
      },
    ],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis:
    env.NODE_ENV === 'production'
      ? ['./dist/modules/**/*.js']
      : ['./src/modules/**/*.ts'],
};

export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Test API',
    version: '1.0.0',
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: {
          200: {
            description: 'OK',
          },
        },
      },
    },
  },
};