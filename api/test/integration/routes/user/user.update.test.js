import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/user.controller.js', () => ({
  test: vi.fn(),
  updateUser: vi.fn((req, res) =>
    res.status(200).json({ _id: 'user123', username: 'updateduser', email: 'updated@test.com' })
  ),
  deleteUser: vi.fn(),
  getUserListings: vi.fn(),
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

import { updateUser } from '../../../../controllers/user.controller.js';
import { verifyToken } from '../../../../utils/verifyUser.js';

const updatedFields = {
  username: 'updateduser',
  email: 'updated@test.com',
};

describe('POST /api/user/update/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });

    updateUser.mockImplementation((req, res) =>
      res.status(200).json({ _id: 'user123', username: 'updateduser', email: 'updated@test.com' })
    );
  });

  it('should return 200 and updated user on success', async () => {
    const res = await request(app)
      .post('/api/user/update/user123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'updateduser');
    expect(res.body).toHaveProperty('email', 'updated@test.com');
  });

  it('should not include password in response', async () => {
    const res = await request(app)
      .post('/api/user/update/user123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(res.body).not.toHaveProperty('password');
  });

  it('should call verifyToken before updateUser', async () => {
    await request(app)
      .post('/api/user/update/user123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(updateUser).toHaveBeenCalledTimes(1);
  });

  it('should pass the user id as a route param', async () => {
    updateUser.mockImplementation((req, res) => {
      expect(req.params.id).toBe('user123');
      return res.status(200).json({ _id: 'user123' });
    });

    await request(app)
      .post('/api/user/update/user123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);
  });

  it('should return 401 when no token is provided', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Unauthorized', status: 401 })
    );

    const res = await request(app)
      .post('/api/user/update/user123')
      .send(updatedFields);

    expect(res.status).toBe(401);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 403, message: 'Forbidden', status: 403 })
    );

    const res = await request(app)
      .post('/api/user/update/user123')
      .set('Cookie', 'access_token=invalidToken')
      .send(updatedFields);

    expect(res.status).toBe(403);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('should return 404 when user is not found', async () => {
    updateUser.mockImplementation((req, res, next) =>
      next({ statusCode: 404, message: 'User not found!', status: 404 })
    );

    const res = await request(app)
      .post('/api/user/update/nonexistentid')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(res.status).toBe(404);
  });

  it('should return 500 if controller throws', async () => {
    updateUser.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'Server error', status: 500 })
    );

    const res = await request(app)
      .post('/api/user/update/user123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(res.status).toBe(500);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/user/update/user123');
    expect(res.status).toBe(404);
  });
});

