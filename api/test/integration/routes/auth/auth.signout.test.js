import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../../app.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_auth_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('GET /api/auth/signout', () => {
  it('should return 200 and logout message', async () => {
    const res = await request(app).get('/api/auth/signout');

    expect(res.status).toBe(200);
    expect(res.body).toBe('User has been logged out!');
  });

  it('should clear the access_token cookie', async () => {
    const res = await request(app).get('/api/auth/signout');

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
  });

  it('should be accessible without a token', async () => {
    const res = await request(app).get('/api/auth/signout');
    expect(res.status).toBe(200);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post('/api/auth/signout');
    expect(res.status).toBe(404);
  });
});