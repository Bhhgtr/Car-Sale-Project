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

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_clisting_db');

  // seed a real user and generate a real JWT
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
});

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

describe('POST /api/listing/create', () => {
  it('should create a listing and return 201', async () => {
    const res = await request(app)
      .post('/api/listing/create')
      .set('Cookie', `access_token=${token}`)
      .send({ ...validListing, userRef: userId });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('name', 'Toyota Camry');
  });

  it('should actually save the listing to the database', async () => {
    await request(app)
      .post('/api/listing/create')
      .set('Cookie', `access_token=${token}`)
      .send({ ...validListing, userRef: userId });

    const listing = await Listing.findOne({ name: 'Toyota Camry' });
    expect(listing).not.toBeNull();
    expect(listing.fuelType).toBe('Petrol');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post('/api/listing/create')
      .send({ ...validListing, userRef: userId });

    expect(res.status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/listing/create')
      .set('Cookie', 'access_token=invalidtoken')
      .send({ ...validListing, userRef: userId });

    expect(res.status).toBe(403);
  });

  it('should return 500 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/listing/create')
      .set('Cookie', `access_token=${token}`)
      .send({ name: 'Incomplete listing' });

    expect(res.status).toBe(500);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get('/api/listing/create');
    expect(res.status).toBe(404);
  });
});