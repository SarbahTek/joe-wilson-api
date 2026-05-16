import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mr. Wilson API',
      version: '1.0.0',
    },
    servers: [
      {
        url:
          env.NODE_ENV === 'production'
            ? 'https://joe-wilson-api-production.up.railway.app'
            : `http://localhost:${env.PORT}`,
      },
    ],
  },


  apis:
    env.NODE_ENV === 'production'
      ? ['./dist/modules/**/*.js']
      : ['./src/modules/**/*.ts'],
});