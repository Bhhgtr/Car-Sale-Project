import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../../app.js';
import User from '../../../../models/user.models.js';
import bcryptjs from 'bcryptjs';

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_signin_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});

  // seed a user directly into DB with hashed password
  const hashedPassword = bcryptjs.hashSync('password123', 10);
  await new User({
    username: 'testuser',
    email: 'test@test.com',
    password: hashedPassword,
  }).save();
});

describe('POST /api/auth/signin', () => {
  it('should return 200 and user data on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'test@test.com');
    expect(res.body).toHaveProperty('username', 'testuser');
  });

  it('should not return password in response body', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.body).not.toHaveProperty('password');
  });

  it('should set httpOnly access_token cookie on success', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('should return 404 when email does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'wrong@test.com', password: 'password123' });

    expect(res.status).toBe(404);
  });

  it('should return 401 when password is incorrect', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/auth/signin');
    expect(res.status).toBe(404);
  });
});