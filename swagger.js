// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FC25 Tournaments API',
      version: '1.0.0',
      description: 'Документация API для платформы онлайн-турниров FC25'
    },
    servers: [
      { url: 'http://localhost:3000', description: 'Локальный сервер' }
    ]
  },
  // Указываем, где искать аннотации (документацию) API
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = {
  swaggerUi,
  swaggerSpec
};
