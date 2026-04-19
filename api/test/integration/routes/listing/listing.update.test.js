import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/listing.controller.js', () => ({
  createListing: vi.fn(),
  deleteListing: vi.fn(),
  updateListing: vi.fn((req, res) => res.status(200).json({ _id: 'listing123', name: 'Updated Camry' })),
  getListing: vi.fn(),
  getListings: vi.fn(),
}));

vi.mock('../../../../utils/verifyUser.js', () => ({
  verifyToken: vi.fn((req, res, next) => {
    req.user = { id: 'user123' };
    next();
  }),
}));

import { updateListing } from '../../../../controllers/listing.controller.js';
import { verifyToken } from '../../../../utils/verifyUser.js';

const updatedFields = {
  name: 'Updated Camry',
  regularPrice: 27000,
};

describe('POST /api/listing/update/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });

    updateListing.mockImplementation((req, res) =>
      res.status(200).json({ _id: 'listing123', name: 'Updated Camry' })
    );
  });

  it('should return 200 on successful update', async () => {
    const res = await request(app)
      .post('/api/listing/update/listing123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Camry');
  });

  it('should call verifyToken before updateListing', async () => {
    await request(app)
      .post('/api/listing/update/listing123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(updateListing).toHaveBeenCalledTimes(1);
  });

  it('should pass the listing id as a route param', async () => {
    updateListing.mockImplementation((req, res) => {
      expect(req.params.id).toBe('listing123');
      return res.status(200).json({ _id: 'listing123', name: 'Updated Camry' });
    });

    await request(app)
      .post('/api/listing/update/listing123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);
  });

  it('should return 401 when no token is provided', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Unauthorized', status: 401 })
    );

    const res = await request(app)
      .post('/api/listing/update/listing123')
      .send(updatedFields);

    expect(res.status).toBe(401);
    expect(updateListing).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 403, message: 'Forbidden', status: 403 })
    );

    const res = await request(app)
      .post('/api/listing/update/listing123')
      .set('Cookie', 'access_token=invalidToken')
      .send(updatedFields);

    expect(res.status).toBe(403);
    expect(updateListing).not.toHaveBeenCalled();
  });

  it('should return 404 when listing is not found', async () => {
    updateListing.mockImplementation((req, res, next) =>
      next({ statusCode: 404, message: 'Listing not found!', status: 404 })
    );

    const res = await request(app)
      .post('/api/listing/update/nonexistentid')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(res.status).toBe(404);
  });

  it('should return 500 if controller throws', async () => {
    updateListing.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'Server error', status: 500 })
    );

    const res = await request(app)
      .post('/api/listing/update/listing123')
      .set('Cookie', 'access_token=mockToken')
      .send(updatedFields);

    expect(res.status).toBe(500);
  });

  it('should not be reachable with DELETE method', async () => {
    const res = await request(app).delete('/api/listing/update/listing123');
    expect(res.status).toBe(404);
  });
});