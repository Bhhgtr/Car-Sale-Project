import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/listing.controller.js', () => ({
  createListing: vi.fn(),
  deleteListing: vi.fn(),
  updateListing: vi.fn(),
  getListing: vi.fn(),
  getListings: vi.fn((req, res) =>
    res.status(200).json([
      { _id: 'listing123', name: 'Toyota Camry' },
      { _id: 'listing456', name: 'Honda Civic' },
    ])
  ),
}));

import { getListings } from '../../../../controllers/listing.controller.js';

describe('GET /api/listing/get', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getListings.mockImplementation((req, res) =>
      res.status(200).json([
        { _id: 'listing123', name: 'Toyota Camry' },
        { _id: 'listing456', name: 'Honda Civic' },
      ])
    );
  });

  it('should return 200 and array of listings', async () => {
    const res = await request(app).get('/api/listing/get');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it('should be publicly accessible without a token', async () => {
    const res = await request(app).get('/api/listing/get');
    expect(res.status).toBe(200);
  });

  it('should call getListings controller once', async () => {
    await request(app).get('/api/listing/get');
    expect(getListings).toHaveBeenCalledTimes(1);
  });

  it('should return an empty array when no listings exist', async () => {
    getListings.mockImplementation((req, res) => res.status(200).json([]));

    const res = await request(app).get('/api/listing/get');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should forward query params to the controller', async () => {
    getListings.mockImplementation((req, res) => {
      expect(req.query.fuelType).toBe('Petrol');
      expect(req.query.type).toBe('sedan');
      return res.status(200).json([]);
    });

    await request(app).get('/api/listing/get?fuelType=Petrol&type=sedan');
  });

  it('should return 500 if controller throws', async () => {
    getListings.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'Server error', status: 500 })
    );

    const res = await request(app).get('/api/listing/get');
    expect(res.status).toBe(500);
  });

  it('should not be reachable with POST method on /get without id', async () => {
    const res = await request(app).post('/api/listing/get');
    expect(res.status).toBe(404);
  });
});


