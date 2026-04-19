import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';

vi.mock('../../../controllers/auth.controller.js', () => ({
  signup: vi.fn(),
  signin: vi.fn((req, res) =>
    res
      .cookie('access_token', 'mockToken', { httpOnly: true })
      .status(200)
      .json({ _id: 'user123', email: 'test@test.com', username: 'testuser' })
  ),
  google: vi.fn(),
  signOut: vi.fn(),
}));

import { signin } from '../../../controllers/auth.controller.js';

describe('POST /api/auth/signin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signin.mockImplementation((req, res) =>
      res
        .cookie('access_token', 'mockToken', { httpOnly: true })
        .status(200)
        .json({ _id: 'user123', email: 'test@test.com', username: 'testuser' })
    );
  });

  it('should return 200 on successful signin', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.status).toBe(200);
  });

  it('should return user data without password', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(res.body).toHaveProperty('email', 'test@test.com');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should set access_token cookie on successful signin', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
  });

  it('should set cookie with httpOnly flag', async () => {
    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('should return 404 when user is not found', async () => {
    signin.mockImplementation((req, res, next) =>
      next({ statusCode: 404, message: 'User not found!', status: 404 })
    );

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'wrong@test.com', password: 'password123' });

    expect(res.status).toBe(404);
  });

  it('should return 401 when password is wrong', async () => {
    signin.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Wrong Credentials!', status: 401 })
    );

    const res = await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'wrongpassword' });

    expect(res.status).toBe(401);
  });

  it('should call signin controller once', async () => {
    await request(app)
      .post('/api/auth/signin')
      .send({ email: 'test@test.com', password: 'password123' });

    expect(signin).toHaveBeenCalledTimes(1);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/auth/signin');
    expect(res.status).toBe(404);
  });
});