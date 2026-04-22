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
  await mongoose.connect('mongodb://127.0.0.1:27017/test_duser_db');
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

describe('DELETE /api/user/delete/:id', () => {
  it('should delete user and return 200', async () => {
    const res = await request(app)
      .delete(`/api/user/delete/${userId}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toBe('User has been deleted!');
  });

  it('should actually remove the user from the database', async () => {
    await request(app)
      .delete(`/api/user/delete/${userId}`)
      .set('Cookie', `access_token=${token}`);

    const user = await User.findById(userId);
    expect(user).toBeNull();
  });

  it('should clear the access_token cookie on deletion', async () => {
    const res = await request(app)
      .delete(`/api/user/delete/${userId}`)
      .set('Cookie', `access_token=${token}`);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith('access_token=;'))).toBe(true);
  });

  it('should return 401 when no token is provided', async () => {
    const res = await request(app).delete(`/api/user/delete/${userId}`);
    expect(res.status).toBe(401);
  });

  it('should return 403 when token is invalid', async () => {
    const res = await request(app)
      .delete(`/api/user/delete/${userId}`)
      .set('Cookie', 'access_token=invalidtoken');

    expect(res.status).toBe(403);
  });

  it('should return 401 when deleting a different user', async () => {
    const otherUser = await new User({
      username: 'otheruser',
      email: 'other@test.com',
      password: bcryptjs.hashSync('password123', 10),
    }).save();

    const res = await request(app)
      .delete(`/api/user/delete/${otherUser._id}`)
      .set('Cookie', `access_token=${token}`);

    expect(res.status).toBe(401);
  });

  it('should not be reachable with GET method', async () => {
    const res = await request(app).get(`/api/user/delete/${userId}`);
    expect(res.status).toBe(404);
  });
});