import { describe, it, expect, vi, beforeEach } from 'vitest';
import { signOut } from '../../../controllers/auth.controller.js';

describe('signOut controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      clearCookie: vi.fn().mockReturnThis(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  it('should clear the access_token cookie and return 200', async () => {
    await signOut(req, res, next);

    expect(res.clearCookie).toHaveBeenCalledWith('access_token');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith('User has been logged out!');
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if an error occurs', async () => {
    const error = new Error('Unexpected error');
    res.clearCookie.mockImplementation(() => { throw error; });

    await signOut(req, res, next);

    expect(next).toHaveBeenCalledWith(error);
  });
});