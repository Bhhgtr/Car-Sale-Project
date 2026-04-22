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
  await mongoose.connect('mongodb://127.0.0.1:27017/test_uuser_db');

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
  await User.deleteMany({});

  // re-seed the user before each test since deleteMany wipes it
  const hashedPassword = bcryptjs.hashSync('password123', 10);
  const user = await new User({
    username: 'testuser',
    email: 'test@test.com',
    password: hashedPassword,
  }).save();

  userId = user._id.toString();
  token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
});

describe('POST /api/user/update/:id', () => {
  it('should update user and return 200', async () => {
    const res = await request(app)
      .post(`/api/user/update/${userId}`)
      .set('Cookie', `access_token=${token}`)
      .send({ username: 'updateduser', email: 'updated@test.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('username', 'updateduser');
    expect(res.body).toHaveProperty('email', 'updated@test.com');
  });

  it('should actually update the user in the database', async () => {
    await request(app)
      .post(`/api/user/update/${userId}`)
      .set('Cookie', `access_token=${token}`)
      .send({ username: 'dbupdateduser', email: 'updated@test.com', password: 'password123' });

    const user = await User.findById(userId);
    expect(user.username).toBe('dbupdateduser');
    expect(user.email).toBe('updated@test.com');
  });

  it('should not return password in response body', async () => {
    const res = await request(app)
      .post(`/api/user/update/${userId}`)
      .set('Cookie', `access_token=${token}`)
      .send({ username: 'updateduser', email: 'updated@test.com', password: 'password123' });

    expect(res.body).not.toHaveProperty('password');
  });

  it('should hash updated password and not store it as plain text', async () => {
    await request(app)
      .post(`/api/user/update/${userId}`)
      .set('Cookie', `access_token=${token}`)
      .send({ username: 'testuser', email: 'test@test.com', password: 'newpassword123' });

    const user = await User.findById(userId);
    expect(user.password).not.toBe('newpassword123');
    expect(user.password).toMatch(/^\$2[ab]\$\d+\$/); // bcrypt hash pattern
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app)
      .post(`/api/user/update/${userId}`)
      .send({ username: 'updateduser', email: 'updated@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    const res = await request(app)
      .post(`/api/user/update/${userId}`)
      .set('Cookie', 'access_token=invalidtoken')
      .send({ username: 'updateduser', email: 'updated@test.com', password: 'password123' });

    expect(res.status).toBe(403);
  });

  it('should return 401 when updating a different user', async () => {
    const otherUser = await new User({
      username: 'otheruser',
      email: 'other@test.com',
      password: bcryptjs.hashSync('password123', 10),
    }).save();

    const res = await request(app)
      .post(`/api/user/update/${otherUser._id}`)
      .set('Cookie', `access_token=${token}`)
      .send({ username: 'hacked', email: 'hacked@test.com', password: 'password123' });

    expect(res.status).toBe(401);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get(`/api/user/update/${userId}`);
    expect(res.status).toBe(404);
  });
});