import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../../app.js';
import User from '../../../../models/user.models.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_signup_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe('POST /api/auth/signup', () => {
  it('should create a user and return 201', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toBe('User created successfully!');
  });

  it('should actually save user to the database', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

    const user = await User.findOne({ email: 'test@test.com' });
    expect(user).not.toBeNull();
    expect(user.username).toBe('testuser');
  });

  it('should store a hashed password not the plain text one', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

    const user = await User.findOne({ email: 'test@test.com' });
    expect(user.password).not.toBe('password123');
    expect(user.password).toMatch(/^\$2[ab]\$\d+\$/); // bcrypt hash pattern
  });

  it('should return 500 when duplicate email is used', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser2', email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(500);
  });

  it('should return 500 when duplicate username is used', async () => {
    await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: 'test@test.com', password: 'password123' });

    const res = await request(app)
      .post('/api/auth/signup')
      .send({ username: 'testuser', email: 'other@test.com', password: 'password123' });

    expect(res.status).toBe(500);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/auth/signup');
    expect(res.status).toBe(404);
  });
});