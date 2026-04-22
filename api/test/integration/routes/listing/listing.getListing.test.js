import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import app from '../../../../app.js';
import Listing from '../../../../models/listing.model.js';
import User from '../../../../models/user.models.js';
import bcryptjs from 'bcryptjs';

let userId;
let listingId;

const validListing = {
  name: 'Toyota Camry',
  description: 'A reliable sedan',
  address: '123 Main St',
  regularPrice: 25000,
  discountPrice: 22000,
  engine: '2.5L V6',
  yom: 2020,
  fuelType: 'petrol',
  type: 'sale',
  offer: true,
  imageUrls: ['http://img.url/car1.jpg'],
};

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_getlisting_db');

  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const user = await new User({
    username: 'testuser',
    email: 'test@test.com',
    password: hashedPassword,
  }).save();

  userId = user._id.toString();
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Listing.deleteMany({});

  const listing = await new Listing({ ...validListing, userRef: userId }).save();
  listingId = listing._id.toString();
});

describe('GET /api/listing/get/:id', () => {
  it('should return 200 and the listing', async () => {
    const res = await request(app).get(`/api/listing/get/${listingId}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', listingId);
    expect(res.body).toHaveProperty('name', 'Toyota Camry');
  });

  it('should be publicly accessible without a token', async () => {
    const res = await request(app).get(`/api/listing/get/${listingId}`);
    expect(res.status).toBe(200);
  });

  it('should return 404 when listing does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/listing/get/${fakeId}`);
    expect(res.status).toBe(404);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post(`/api/listing/get/${listingId}`);
    expect(res.status).toBe(404);
  });
});

describe('GET /api/listing/get', () => {
  it('should return 200 and array of listings', async () => {
    const res = await request(app).get('/api/listing/get');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('should be publicly accessible without a token', async () => {
    const res = await request(app).get('/api/listing/get');
    expect(res.status).toBe(200);
  });

  it('should return an empty array when no listings exist', async () => {
    await Listing.deleteMany({});
    const res = await request(app).get('/api/listing/get');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should filter listings by fuelType query param', async () => {
  await new Listing({ ...validListing, userRef: userId, name: 'Honda Civic', fuelType: 'diesel' }).save();

  const res = await request(app).get('/api/listing/get?fuelType=petrol');

  expect(res.status).toBe(200);
  expect(res.body.every((l) => l.fuelType === 'petrol')).toBe(true);
});
});