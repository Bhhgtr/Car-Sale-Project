import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signin } from '../../../controllers/auth.controller.js';
import User from '../../../models/user.models.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../../../utils/error.js';

vi.mock('../../../models/user.models.js');
vi.mock('bcryptjs');
vi.mock('jsonwebtoken');
vi.mock('../../../utils/error.js');

describe('signin controller', () => {
  let req, res, next;

  const mockUser = {
    _id: 'user123',
    email: 'test@test.com',
    password: 'hashedPassword',
    _doc: {
      _id: 'user123',
      email: 'test@test.com',
      username: 'testuser',
      password: 'hashedPassword',
    },
  };

  beforeEach(() => {
    req = {
      body: { email: 'test@test.com', password: 'password123' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  it('should sign in successfully and set cookie', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcryptjs.compareSync.mockReturnValue(true);
    jwt.sign.mockReturnValue('mockToken');

    await signin(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@test.com' });
    expect(bcryptjs.compareSync).toHaveBeenCalledWith('password123', 'hashedPassword');
    expect(jwt.sign).toHaveBeenCalledWith({ id: 'user123' }, process.env.JWT_SECRET);
    expect(res.cookie).toHaveBeenCalledWith('access_token', 'mockToken', { httpOnly: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should not include password in response body', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcryptjs.compareSync.mockReturnValue(true);
    jwt.sign.mockReturnValue('mockToken');

    await signin(req, res, next);

    const jsonPayload = res.json.mock.calls[0][0];
    expect(jsonPayload).not.toHaveProperty('password');
    expect(jsonPayload).toHaveProperty('email', 'test@test.com');
  });

  it('should call next with 404 error if user not found', async () => {
    User.findOne.mockResolvedValue(null);
    errorHandler.mockReturnValue({ statusCode: 404, message: 'User not found!' });

    await signin(req, res, next);

    expect(next).toHaveBeenCalledWith({ statusCode: 404, message: 'User not found!' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next with 401 error if password is wrong', async () => {
    User.findOne.mockResolvedValue(mockUser);
    bcryptjs.compareSync.mockReturnValue(false);
    errorHandler.mockReturnValue({ statusCode: 401, message: 'Wrong Credentials!' });

    await signin(req, res, next);

    expect(next).toHaveBeenCalledWith({ statusCode: 401, message: 'Wrong Credentials!' });
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should call next if a db error occurs', async () => {
    const dbError = new Error('DB error');
    User.findOne.mockRejectedValue(dbError);

    await signin(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
  });
});