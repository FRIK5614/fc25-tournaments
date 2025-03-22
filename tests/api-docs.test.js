// tests/api-docs.test.js
const request = require('supertest');
const app = require('../app');

describe('GET /api-docs/', () => {
  it('should return Swagger UI HTML', async () => {
    const res = await request(app).get('/api-docs/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toMatch(/Swagger UI/);
  });
});
