import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../../../app.js';

vi.mock('../../../../controllers/listing.controller.js', () => ({
  createListing: vi.fn(),
  deleteListing: vi.fn(),
  updateListing: vi.fn(),
  getListing: vi.fn((req, res) =>
    res.status(200).json({ _id: 'listing123', name: 'Toyota Camry' })
  ),
  getListings: vi.fn(),
}));

// No verifyToken mock needed — getListing is a public route

import { getListing } from '../../../../controllers/listing.controller.js';

describe('GET /api/listing/get/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    getListing.mockImplementation((req, res) =>
      res.status(200).json({ _id: 'listing123', name: 'Toyota Camry' })
    );
  });

  it('should return 200 and listing data', async () => {
    const res = await request(app).get('/api/listing/get/listing123');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', 'listing123');
    expect(res.body).toHaveProperty('name', 'Toyota Camry');
  });

  it('should be publicly accessible without a token', async () => {
    const res = await request(app).get('/api/listing/get/listing123');

    // no cookie set — should still succeed
    expect(res.status).toBe(200);
  });

  it('should call getListing controller once', async () => {
    await request(app).get('/api/listing/get/listing123');
    expect(getListing).toHaveBeenCalledTimes(1);
  });

  it('should pass the listing id as a route param', async () => {
    getListing.mockImplementation((req, res) => {
      expect(req.params.id).toBe('listing123');
      return res.status(200).json({ _id: 'listing123', name: 'Toyota Camry' });
    });

    await request(app).get('/api/listing/get/listing123');
  });

  it('should return 404 when listing is not found', async () => {
    getListing.mockImplementation((req, res, next) =>
      next({ statusCode: 404, message: 'Listing not found!', status: 404 })
    );

    const res = await request(app).get('/api/listing/get/nonexistentid');
    expect(res.status).toBe(404);
  });

  it('should return 500 if controller throws', async () => {
    getListing.mockImplementation((req, res, next) =>
      next({ statusCode: 500, message: 'Server error', status: 500 })
    );

    const res = await request(app).get('/api/listing/get/listing123');
    expect(res.status).toBe(500);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post('/api/listing/get/listing123');
    expect(res.status).toBe(404);
  });
});


