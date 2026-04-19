import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../app.js';

vi.mock('../../../controllers/auth.controller.js', () => ({
  signup: vi.fn(),
  signin: vi.fn(),
  google: vi.fn((req, res) =>
    res
      .cookie('access_token', 'mockToken', { httpOnly: true })
      .status(200)
      .json({ _id: 'user123', email: 'google@test.com', username: 'googleuser' })
  ),
  signOut: vi.fn(),
}));

import { google } from '../../../controllers/auth.controller.js';

describe('POST /api/auth/google', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    google.mockImplementation((req, res) =>
      res
        .cookie('access_token', 'mockToken', { httpOnly: true })
        .status(200)
        .json({ _id: 'user123', email: 'google@test.com', username: 'googleuser' })
    );
  });

  it('should return 200 for existing google user', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ email: 'google@test.com', name: 'Google User', photo: 'http://photo.url/pic.jpg' });

    expect(res.status).toBe(200);
  });

  it('should return user data without password', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ email: 'google@test.com', name: 'Google User', photo: 'http://photo.url/pic.jpg' });

    expect(res.body).toHaveProperty('email', 'google@test.com');
    expect(res.body).not.toHaveProperty('password');
  });

  it('should set access_token cookie', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ email: 'google@test.com', name: 'Google User', photo: 'http://photo.url/pic.jpg' });

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('access_token='))).toBe(true);
  });

  it('should set cookie with httpOnly flag', async () => {
    const res = await request(app)
      .post('/api/auth/google')
      .send({ email: 'google@test.com', name: 'Google User', photo: 'http://photo.url/pic.jpg' });

    const cookies = res.headers['set-cookie'];
    expect(cookies.some((c) => c.includes('HttpOnly'))).toBe(true);
  });

  it('should return 200 and create new user if google email not registered', async () => {
    google.mockImplementation((req, res) =>
      res
        .cookie('access_token', 'mockToken', { httpOnly: true })
        .status(200)
        .json({ _id: 'newUser123', email: 'new@google.com', username: 'newgoogleuser' })
    );

    const res = await request(app)
      .post('/api/auth/google')
      .send({ email: 'new@google.com', name: 'New User', photo: 'http://photo.url/pic.jpg' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('email', 'new@google.com');
  });

  it('should return 500 if controller throws', async () => {
    google.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'Server error', status: 500 })
    );

    const res = await request(app)
      .post('/api/auth/google')
      .send({ email: 'google@test.com', name: 'Google User', photo: 'http://photo.url/pic.jpg' });

    expect(res.status).toBe(500);
  });

  it('should call google controller once', async () => {
    await request(app)
      .post('/api/auth/google')
      .send({ email: 'google@test.com', name: 'Google User', photo: 'http://photo.url/pic.jpg' });

    expect(google).toHaveBeenCalledTimes(1);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/auth/google');
    expect(res.status).toBe(404);
  });
});