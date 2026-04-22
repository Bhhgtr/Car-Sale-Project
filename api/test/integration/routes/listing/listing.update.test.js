import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../../app.js';
import Listing from '../../../../models/listing.model.js';
import User from '../../../../models/user.models.js';
import bcryptjs from 'bcryptjs';

let token;
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
  fuelType: 'Petrol',
  type: 'sedan',
  offer: true,
  imageUrls: ['http://img.url/car1.jpg'],
};

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_listing_db');

  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const user = await new User({
    username: 'testuser',
    email: 'test@test.com',
    password: hashedPassword,
  }).save();

  userId = user._id.toString();
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
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

describe('POST /api/listing/update/:id', () => {
  it('should update listing and return 200', async () => {
    const res = await request(app)
      .post(`/api/listing/update/${listingId}`)
      .set('Cookie', `access_token=${token}`)
      .send({ ...validListing, userRef: userId, name: 'Updated Camry' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Updated Camry');
  });

  it('should actually update the listing in the database', async () => {
    await request(app)
      .post(`/api/listing/update/${listingId}`)
      .set('Cookie', `access_token=${token}`)
      .send({ ...validListing, userRef: userId, regularPrice: 30000 });

    const listing = await Listing.findById(listingId);
    expect(listing.regularPrice).toBe(30000);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post(`/api/listing/update/${listingId}`)
      .send({ ...validListing, name: 'Updated Camry' });

    expect(res.status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    const res = await request(app)
      .post(`/api/listing/update/${listingId}`)
      .set('Cookie', 'access_token=invalidtoken')
      .send({ ...validListing, name: 'Updated Camry' });

    expect(res.status).toBe(403);
  });

  it('should return 404 when listing does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .post(`/api/listing/update/${fakeId}`)
      .set('Cookie', `access_token=${token}`)
      .send({ ...validListing, userRef: userId });

    expect(res.status).toBe(404);
  });

  it('should not be reachable with DELETE method', async () => {
    const res = await request(app).delete(`/api/listing/update/${listingId}`);
    expect(res.status).toBe(404);
  });
});