import { describe, it, expect, vi, beforeEach } from 'vitest';
import { google } from '../../../controllers/auth.controller.js';
import User from '../../../models/user.models.js';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

vi.mock('../../../models/user.models.js', () => {
  const UserMock = vi.fn();
  UserMock.findOne = vi.fn();
  return { default: UserMock };
});

vi.mock('bcryptjs');
vi.mock('jsonwebtoken');

describe('google controller', () => {
  let req, res, next;

  const existingUser = {
    _id: 'user123',
    _doc: {
      _id: 'user123',
      email: 'google@test.com',
      username: 'googleuser',
      password: 'hashedPassword',
    },
  };

  beforeEach(() => {
    req = {
      body: {
        email: 'google@test.com',
        name: 'Google User',
        photo: 'http://photo.url/pic.jpg',
      },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      cookie: vi.fn().mockReturnThis(),
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  it('should sign in existing google user and set cookie', async () => {
    User.findOne.mockResolvedValue(existingUser);
    jwt.sign.mockReturnValue('mockToken');

    await google(req, res, next);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'google@test.com' });
    expect(jwt.sign).toHaveBeenCalledWith({ id: 'user123' }, process.env.JWT_SECRET);
    expect(res.cookie).toHaveBeenCalledWith('access_token', 'mockToken', { httpOnly: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should not include password in response for existing user', async () => {
    User.findOne.mockResolvedValue(existingUser);
    jwt.sign.mockReturnValue('mockToken');

    await google(req, res, next);

    const jsonPayload = res.json.mock.calls[0][0];
    expect(jsonPayload).not.toHaveProperty('password');
  });

  it('should create a new user if google email not found', async () => {
    User.findOne.mockResolvedValue(null);
    bcryptjs.hashSync.mockReturnValue('hashedGeneratedPassword');
    jwt.sign.mockReturnValue('mockToken');

    const saveMock = vi.fn().mockResolvedValue(true);
    const newUserInstance = {
      save: saveMock,
      _doc: {
        _id: 'newUser123',
        email: 'google@test.com',
        username: 'googleuser1234',
      },
    };


    User.mockImplementation(function () {
      return newUserInstance;
    });

    await google(req, res, next);

    expect(bcryptjs.hashSync).toHaveBeenCalled();
    expect(saveMock).toHaveBeenCalled();
    expect(res.cookie).toHaveBeenCalledWith('access_token', 'mockToken', { httpOnly: true });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  it('should generate a lowercase username from name for new user', async () => {
    User.findOne.mockResolvedValue(null);
    bcryptjs.hashSync.mockReturnValue('hashedGeneratedPassword');
    jwt.sign.mockReturnValue('mockToken');

    let capturedArgs = null;

    User.mockImplementation(function (args) {
      capturedArgs = args;
      return {
        save: vi.fn().mockResolvedValue(true),
        _doc: { ...args, password: undefined },
      };
    });

    await google(req, res, next);

    expect(capturedArgs).not.toBeNull();

    expect(capturedArgs.username).toMatch(/^googleuser[a-z0-9]{4}$/);
    expect(capturedArgs.email).toBe('google@test.com');
    expect(capturedArgs.avatar).toBe('http://photo.url/pic.jpg');
  });

  it('should call next if an error occurs', async () => {
    const error = new Error('DB error');
    User.findOne.mockRejectedValue(error);

    await google(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});