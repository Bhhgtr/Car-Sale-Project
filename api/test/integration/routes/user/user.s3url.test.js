import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/user.controller.js', () => ({
  test: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserListings: vi.fn(),
  getUser: vi.fn(),
}));

vi.mock('../../../../controllers/s3.controller.js', () => ({
  getPresignedUrl: vi.fn((req, res) =>
    res.status(200).json({
      url: 'https://s3.amazonaws.com/bucket/mock-key?signed=true',
      key: '1234567890-car.jpg',
    })
  ),
}));

vi.mock('../../../../utils/verifyUser.js', () => ({
  verifyToken: vi.fn((req, res, next) => {
    req.user = { id: 'user123' };
    next();
  }),
}));

import { getPresignedUrl } from '../../../../controllers/s3.controller.js';
import { verifyToken } from '../../../../utils/verifyUser.js';

describe('GET /api/user/s3-url', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });

    getPresignedUrl.mockImplementation((req, res) =>
      res.status(200).json({
        url: 'https://s3.amazonaws.com/bucket/mock-key?signed=true',
        key: '1234567890-car.jpg',
      })
    );
  });

  it('should return 200 with a presigned url and key', async () => {
    const res = await request(app)
      .get('/api/user/s3-url')
      .set('Cookie', 'access_token=mockToken')
      .query({ fileName: 'car.jpg', fileType: 'image/jpeg' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('url');
    expect(res.body).toHaveProperty('key');
  });

  it('should call verifyToken before getPresignedUrl', async () => {
    await request(app)
      .get('/api/user/s3-url')
      .set('Cookie', 'access_token=mockToken')
      .query({ fileName: 'car.jpg', fileType: 'image/jpeg' });

    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(getPresignedUrl).toHaveBeenCalledTimes(1);
  });

  it('should forward fileName and fileType query params to controller', async () => {
    getPresignedUrl.mockImplementation((req, res) => {
      expect(req.query.fileName).toBe('car.jpg');
      expect(req.query.fileType).toBe('image/jpeg');
      return res.status(200).json({ url: 'https://mock.url', key: 'mock-key' });
    });

    await request(app)
      .get('/api/user/s3-url')
      .set('Cookie', 'access_token=mockToken')
      .query({ fileName: 'car.jpg', fileType: 'image/jpeg' });
  });

  it('should return 401 when no token is provided', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Unauthorized', status: 401 })
    );

    const res = await request(app)
      .get('/api/user/s3-url')
      .query({ fileName: 'car.jpg', fileType: 'image/jpeg' });

    expect(res.status).toBe(401);
    expect(getPresignedUrl).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 403, message: 'Forbidden', status: 403 })
    );

    const res = await request(app)
      .get('/api/user/s3-url')
      .set('Cookie', 'access_token=invalidToken')
      .query({ fileName: 'car.jpg', fileType: 'image/jpeg' });

    expect(res.status).toBe(403);
    expect(getPresignedUrl).not.toHaveBeenCalled();
  });

  it('should return 500 if S3 signing fails', async () => {
    getPresignedUrl.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'S3 error', status: 500 })
    );

    const res = await request(app)
      .get('/api/user/s3-url')
      .set('Cookie', 'access_token=mockToken')
      .query({ fileName: 'car.jpg', fileType: 'image/jpeg' });

    expect(res.status).toBe(500);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post('/api/user/s3-url');
    expect(res.status).toBe(404);
  });
});