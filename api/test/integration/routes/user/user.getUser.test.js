import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/user.controller.js', () => ({
  test: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserListings: vi.fn(),
  getUser: vi.fn((req, res) =>
    res.status(200).json({ _id: 'user123', username: 'testuser', email: 'test@test.com' })
  ),
}));

vi.mock('../../../../controllers/s3.controller.js', () => ({
  getPresignedUrl: vi.fn(),
}));

vi.mock('../../../../utils/verifyUser.js', () => ({
  verifyToken: vi.fn((req, res, next) => {
    req.user = { id: 'user123' };
    next();
  }),
}));

import { getUser } from '../../../../controllers/user.controller.js';
import { verifyToken } from '../../../../utils/verifyUser.js';

describe('GET /api/user/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });

    getUser.mockImplementation((req, res) =>
      res.status(200).json({ _id: 'user123', username: 'testuser', email: 'test@test.com' })
    );
  });

  it('should return 200 and user data', async () => {
    const res = await request(app)
      .get('/api/user/user123')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', 'user123');
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@test.com');
  });

  it('should not include password in response', async () => {
    const res = await request(app)
      .get('/api/user/user123')
      .set('Cookie', 'access_token=mockToken');

    expect(res.body).not.toHaveProperty('password');
  });

  it('should call verifyToken before getUser', async () => {
    await request(app)
      .get('/api/user/user123')
      .set('Cookie', 'access_token=mockToken');

    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(getUser).toHaveBeenCalledTimes(1);
  });

  it('should pass the user id as a route param', async () => {
    getUser.mockImplementation((req, res) => {
      expect(req.params.id).toBe('user123');
      return res.status(200).json({ _id: 'user123' });
    });

    await request(app)
      .get('/api/user/user123')
      .set('Cookie', 'access_token=mockToken');
  });

  it('should return 401 when no token is provided', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Unauthorized', status: 401 })
    );

    const res = await request(app).get('/api/user/user123');

    expect(res.status).toBe(401);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 403, message: 'Forbidden', status: 403 })
    );

    const res = await request(app)
      .get('/api/user/user123')
      .set('Cookie', 'access_token=invalidToken');

    expect(res.status).toBe(403);
    expect(getUser).not.toHaveBeenCalled();
  });

  it('should return 404 when user is not found', async () => {
    getUser.mockImplementation((req, res, next) =>
      next({ statusCode: 404, message: 'User not found!', status: 404 })
    );

    const res = await request(app)
      .get('/api/user/nonexistentid')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(404);
  });

  it('should return 500 if controller throws', async () => {
    getUser.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'Server error', status: 500 })
    );

    const res = await request(app)
      .get('/api/user/user123')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(500);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post('/api/user/user123');
    expect(res.status).toBe(404);
  });
});