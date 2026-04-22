import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../../../app.js';
import User from '../../../../models/user.models.js';
import bcryptjs from 'bcryptjs';

let token;
let userId;

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_gluser_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});

  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const user = await new User({
    username: 'testuser',
    email: 'test@test.com',
    password: hashedPassword,
  }).save();

  userId = user._id.toString();
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
});

describe('GET /api/user/:id', () => {
  it('should return 200 and user data', async () => {
    const res = await request(app)
      .get(`/api/user/${userId}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('_id', userId);
    expect(res.body).toHaveProperty('username', 'testuser');
    expect(res.body).toHaveProperty('email', 'test@test.com');
  });

  it('should not return password in response body', async () => {
    const res = await request(app)
      .get(`/api/user/${userId}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.body).not.toHaveProperty('password');
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).get(`/api/user/${userId}`);
    expect(res.status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    const res = await request(app)
      .get(`/api/user/${userId}`)
      .set('Cookie', 'access_token=invalidtoken');

    expect(res.status).toBe(403);
  });

  it('should return 404 when user does not exist', async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await request(app)
      .get(`/api/user/${fakeId}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(404);
  });

  it('should not be reachable with POST method', async () => {
    const res = await request(app).post(`/api/user/${userId}`);
    expect(res.status).toBe(404);
  });
});