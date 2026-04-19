import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signup } from '../../../controllers/auth.controller.js';
import User from '../../../models/user.models.js';
import bcryptjs from 'bcryptjs';

vi.mock('../../../models/user.models.js');
vi.mock('bcryptjs');

describe('signup controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: { username: 'testuser', email: 'test@test.com', password: 'password123' },
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  it('should create a new user and return 201', async () => {
    bcryptjs.hashSync.mockReturnValue('hashedPassword');

    const mockSave = vi.fn().mockResolvedValue(true);
    User.mockImplementation(function () {
      this.save = mockSave;
      this.password = 'hashedPassword';
    });

    await signup(req, res, next);

    expect(bcryptjs.hashSync).toHaveBeenCalledWith('password123', 10);
    expect(mockSave).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith('User created successfully!');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next with error if save fails', async () => {
    const dbError = new Error('DB error');
    bcryptjs.hashSync.mockReturnValue('hashedPassword');

    User.mockImplementation(function () {
      this.save = vi.fn().mockRejectedValue(dbError);
    });

    await signup(req, res, next);

    expect(next).toHaveBeenCalledWith(dbError);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('should hash the password before saving', async () => {
    bcryptjs.hashSync.mockReturnValue('hashedPassword');

    const mockSave = vi.fn().mockResolvedValue(true);
    User.mockImplementation(function () {
      this.save = mockSave;
      this.password = 'hashedPassword';
    });

    await signup(req, res, next);

    expect(bcryptjs.hashSync).toHaveBeenCalledWith('password123', 10);

    expect(User).toHaveBeenCalledWith({
      username: 'testuser',
      email: 'test@test.com',
      password: 'hashedPassword', 
    });
  });
});