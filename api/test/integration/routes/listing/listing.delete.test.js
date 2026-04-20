import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/listing.controller.js', () => ({
  createListing: vi.fn(),
  deleteListing: vi.fn((req, res) => res.status(200).json('Listing has been deleted!')),
  updateListing: vi.fn(),
  getListing: vi.fn(),
  getListings: vi.fn(),
}));

vi.mock('../../../../utils/verifyUser.js', () => ({
  verifyToken: vi.fn((req, res, next) => {
    req.user = { id: 'user123' };
    next();
  }),
}));

import { deleteListing } from '../../../../controllers/listing.controller.js';
import { verifyToken } from '../../../../utils/verifyUser.js';

describe('DELETE /api/listing/delete/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });

    deleteListing.mockImplementation((req, res) =>
      res.status(200).json('Listing has been deleted!')
    );
  });

  it('should return 200 on successful deletion', async () => {
    const res = await request(app)
      .delete('/api/listing/delete/listing123')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(200);
    expect(res.body).toBe('Listing has been deleted!');
  });

  it('should call verifyToken before deleteListing', async () => {
    await request(app)
      .delete('/api/listing/delete/listing123')
      .set('Cookie', 'access_token=mockToken');

    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(deleteListing).toHaveBeenCalledTimes(1);
  });

  it('should pass the listing id as a route param', async () => {
    deleteListing.mockImplementation((req, res) => {
      expect(req.params.id).toBe('listing123');
      return res.status(200).json('Listing has been deleted!');
    });

    await request(app)
      .delete('/api/listing/delete/listing123')
      .set('Cookie', 'access_token=mockToken');
  });

  it('should return 401 when no token is provided', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Unauthorized', status: 401 })
    );

    const res = await request(app).delete('/api/listing/delete/listing123');

    expect(res.status).toBe(401);
    expect(deleteListing).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 403, message: 'Forbidden', status: 403 })
    );

    const res = await request(app)
      .delete('/api/listing/delete/listing123')
      .set('Cookie', 'access_token=invalidToken');

    expect(res.status).toBe(403);
    expect(deleteListing).not.toHaveBeenCalled();
  });

  it('should return 404 when listing is not found', async () => {
    deleteListing.mockImplementation((req, res, next) =>
      next({ statusCode: 404, message: 'Listing not found!', status: 404 })
    );

    const res = await request(app)
      .delete('/api/listing/delete/nonexistentid')
      .set('Cookie', 'access_token=mockToken');

    expect(res.status).toBe(404);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/listing/delete/listing123');
    expect(res.status).toBe(404);
  });
});