import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/user.controller.js', () => ({
  test: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
  getUserListings: vi.fn((req, res) =>
    res.status(200).json([
      { _id: 'listing123', name: 'Toyota Camry' },
      { _id: 'listing456', name: 'Honda Civic' },
    ])
  ),
  getUser: vi.fn(),
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

import { getUserListings } from '../../../../controllers/user.controller.js';
import { verifyToken } from '../../../../utils/verifyUser.js';

describe('GET /api/user/listings/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });

    getUserListings.mockImplementation((req, res) =>
      res.status(200).json([
        { _id: 'listing123', name: 'Toyota Camry' },
        { _id: 'listing456', name: 'Honda Civic' },
      ])
    );
  });

  it('should return 200 and array of user listings', async () => {
    const res = await request(app)
      .get('/api/user/listings/user123')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it('should call verifyToken before getUserListings', async () => {
    await request(app)
      .get('/api/user/listings/user123')
      .set('Cookie', 'access_token=mockToken');

    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(getUserListings).toHaveBeenCalledTimes(1);
  });

  it('should pass the user id as a route param', async () => {
    getUserListings.mockImplementation((req, res) => {
      expect(req.params.id).toBe('user123');
      return res.status(200).json([]);
    });

    await request(app)
      .get('/api/user/listings/user123')
      .set('Cookie', 'access_token=mockToken');
  });

  it('should return an empty array when user has no listings', async () => {
    getUserListings.mockImplementation((req, res) => res.status(200).json([]));

    const res = await request(app)
      .get('/api/user/listings/user123')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 401 when no token is provided', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Unauthorized', status: 401 })
    );

    const res = await request(app).get('/api/user/listings/user123');

    expect(res.status).toBe(401);
    expect(getUserListings).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 403, message: 'Forbidden', status: 403 })
    );

    const res = await request(app)
      .get('/api/user/listings/user123')
      .set('Cookie', 'access_token=invalidToken');

    expect(res.status).toBe(403);
    expect(getUserListings).not.toHaveBeenCalled();
  });

  it('should return 404 when user is not found', async () => {
    getUserListings.mockImplementation((req, res, next) =>
      next({ statusCode: 404, message: 'User not found!', status: 404 })
    );

    const res = await request(app)
      .get('/api/user/listings/nonexistentid')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(404);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post('/api/user/listings/user123');
    expect(res.status).toBe(404);
  });
});