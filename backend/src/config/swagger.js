import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

// Get port from environment or use default 5000
const port = env.PORT || 5000;
const serverUrl = `http://localhost:${port}`;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Uber Clone API',
      version: '1.0.0',
      description: 'Complete API documentation for the Uber Clone backend service',
      contact: {
        name: 'API Support',
        email: 'support@uberclone.com'
      }
    },
    servers: [
      {
        url: serverUrl,
        description: `Development server (Port: ${port})`
      }
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT Authorization header using the Bearer scheme. Example: "Authorization: Bearer {token}"'
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User signup and login endpoints'
      },
      {
        name: 'Profile',
        description: 'User profile management endpoints'
      },
      {
        name: 'Driver',
        description: 'Driver profile creation, update, status toggle, and completion tracking'
      },
      {
        name: 'Journey',
        description: 'Journey (ride) booking, status updates, history, and payment'
      }
    ]
  },
  apis: [
    './src/modules/auth/auth.controller.js',
    './src/modules/profile/profile.controller.js',
    './src/modules/driver/driver.controller.js',
    './src/modules/journey/journey.controller.js'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
