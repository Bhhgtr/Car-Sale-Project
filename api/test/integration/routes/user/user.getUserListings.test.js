import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../../app.js';
import User from '../../../../models/user.models.js';
import Listing from '../../../../models/listing.model.js';
import bcryptjs from 'bcryptjs';

let token;
let userId;

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
  await mongoose.connect('mongodb://127.0.0.1:27017/test_guluser_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
  await Listing.deleteMany({});

  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const user = await new User({
    username: 'testuser',
    email: 'test@test.com',
    password: hashedPassword,
  }).save();

  userId = user._id.toString();
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
});

describe('GET /api/user/listings/:id', () => {
  it('should return 200 and array of user listings', async () => {
    await new Listing({ ...validListing, userRef: userId }).save();
    await new Listing({ ...validListing, name: 'Honda Civic', userRef: userId }).save();

    const res = await request(app)
      .get(`/api/user/listings/${userId}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(2);
  });

  it('should return only listings belonging to the user', async () => {
    // seed another user with their own listing
    const otherUser = await new User({
      username: 'otheruser',
      email: 'other@test.com',
      password: bcryptjs.hashSync('password123', 10),
    }).save();

    await new Listing({ ...validListing, userRef: userId }).save();
    await new Listing({ ...validListing, name: 'Other Car', userRef: otherUser._id.toString() }).save();

    const res = await request(app)
      .get(`/api/user/listings/${userId}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].userRef).toBe(userId);
  });

  it('should return empty array when user has no listings', async () => {
    const res = await request(app)
      .get(`/api/user/listings/${userId}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get(`/api/user/listings/${userId}`);
    expect(res.status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    const res = await request(app)
      .get(`/api/user/listings/${userId}`)
      .set('Cookie', 'access_token=invalidtoken');

    expect(res.status).toBe(403);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post(`/api/user/listings/${userId}`);
    expect(res.status).toBe(404);
  });
});