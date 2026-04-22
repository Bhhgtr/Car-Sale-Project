import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Car Sale API',
      version: '1.0.0',
      description: 'API documentation for the Car Sale app',
    },
    servers: [
      {
        url: 'http://localhost:3000', // change to your API port
      },
    ],
     components: {
      securitySchemes: {
        cookieAuth: {          
          type: 'apiKey',
          in: 'cookie',
          name: 'access_token',
        },
      },
    },
  },
  apis: ['./api/docs/*.docs.js'], // route files
};

export const swaggerSpec = swaggerJsdoc(options);