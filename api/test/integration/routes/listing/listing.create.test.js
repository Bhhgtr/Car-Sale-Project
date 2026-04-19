import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';


vi.mock('../../../../controllers/listing.controller.js', () => ({
  createListing: vi.fn((req, res) => res.status(201).json({ _id: 'listing123', name: 'Toyota Camry' })),
  deleteListing: vi.fn(),
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

import { createListing } from '../../../../controllers/listing.controller.js';
import { verifyToken } from '../../../../utils/verifyUser.js';

const validListing = {
  name: 'Toyota Camry',
  description: 'A reliable sedan',
  address: '123 Main St',
  regularPrice: 25000,
  discountPrice: 22000,
  engine: '2.5L V6',
  yom: 2020,
  fuelType: 'Petrol',
  type: 'sedan',
  offer: true,
  imageUrls: ['http://img.url/car1.jpg'],
  userRef: 'user123',
};

describe('POST /api/listing/create', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    verifyToken.mockImplementation((req, res, next) => {
      req.user = { id: 'user123' };
      next();
    });

    createListing.mockImplementation((req, res) =>
      res.status(201).json({ _id: 'listing123', name: 'Toyota Camry' })
    );
  });

  it('should return 201 on successful listing creation', async () => {
    const res = await request(app)
      .post('/api/listing/create')
      .set('Cookie', 'access_token=mockToken')
      .send(validListing);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id', 'listing123');
  });

  it('should call verifyToken middleware before createListing', async () => {
    await request(app)
      .post('/api/listing/create')
      .set('Cookie', 'access_token=mockToken')
      .send(validListing);

    expect(verifyToken).toHaveBeenCalledTimes(1);
    expect(createListing).toHaveBeenCalledTimes(1);
  });

  it('should return 401 when no token is provided', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 401, message: 'Unauthorized', status: 401 })
    );

    const res = await request(app)
      .post('/api/listing/create')
      .send(validListing);

    expect(res.status).toBe(401);
    expect(createListing).not.toHaveBeenCalled();
  });

  it('should return 403 when token is invalid', async () => {
    verifyToken.mockImplementation((req, res, next) =>
      next({ statusCode: 403, message: 'Forbidden', status: 403 })
    );

    const res = await request(app)
      .post('/api/listing/create')
      .set('Cookie', 'access_token=invalidToken')
      .send(validListing);

    expect(res.status).toBe(403);
    expect(createListing).not.toHaveBeenCalled();
  });

  it('should return 500 if controller throws', async () => {
    createListing.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'Server error', status: 500 })
    );

    const res = await request(app)
      .post('/api/listing/create')
      .set('Cookie', 'access_token=mockToken')
      .send(validListing);

    expect(res.status).toBe(500);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/listing/create');
    expect(res.status).toBe(404);
  });
});