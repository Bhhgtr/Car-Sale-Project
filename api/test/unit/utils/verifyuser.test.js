import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { verifyToken } from '../../../utils/verifyUser.js';
import { errorHandler } from '../../../utils/error.js';

vi.mock('jsonwebtoken');
vi.mock('../../../utils/error.js');

describe('verifyToken middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {};
    next = vi.fn();

    vi.clearAllMocks();
  });

  describe('missing token', () => {
    it('should call next with 401 error when no token is present', () => {
      errorHandler.mockReturnValue({ statusCode: 401, message: 'Unauthorized' });

      verifyToken(req, res, next);

      expect(errorHandler).toHaveBeenCalledWith(401, 'Unauthorized');
      expect(next).toHaveBeenCalledWith({ statusCode: 401, message: 'Unauthorized' });
    });

    it('should not call jwt.verify when token is missing', () => {
      verifyToken(req, res, next);
      expect(jwt.verify).not.toHaveBeenCalled();
    });
  });

  describe('invalid / expired token', () => {
    it('should call next with 403 error when token is invalid', () => {
      req.cookies.access_token = 'invalidtoken';
      errorHandler.mockReturnValue({ statusCode: 403, message: 'Forbidden' });

      // simulate jwt.verify calling callback with an error
      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('invalid token'), null);
      });

      verifyToken(req, res, next);

      expect(errorHandler).toHaveBeenCalledWith(403, 'Forbidden');
      expect(next).toHaveBeenCalledWith({ statusCode: 403, message: 'Forbidden' });
    });

    it('should not attach user to req when token is invalid', () => {
      req.cookies.access_token = 'invalidtoken';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(new Error('invalid token'), null);
      });

      verifyToken(req, res, next);

      expect(req.user).toBeUndefined();
    });
  });

  describe('valid token', () => {
    it('should attach decoded user to req.user on valid token', () => {
      req.cookies.access_token = 'validtoken';
      const decodedUser = { id: 'user123' };

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, decodedUser);
      });

      verifyToken(req, res, next);

      expect(req.user).toEqual(decodedUser);
    });

    it('should call next with no arguments on valid token', () => {
      req.cookies.access_token = 'validtoken';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 'user123' });
      });

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalledWith(); 
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should verify token using JWT_SECRET env variable', () => {
      req.cookies.access_token = 'validtoken';
      process.env.JWT_SECRET = 'testsecret';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 'user123' });
      });

      verifyToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        'validtoken',
        process.env.JWT_SECRET,
        expect.any(Function)
      );
    });

    it('should not call errorHandler on valid token', () => {
      req.cookies.access_token = 'validtoken';

      jwt.verify.mockImplementation((token, secret, callback) => {
        callback(null, { id: 'user123' });
      });

      verifyToken(req, res, next);

      expect(errorHandler).not.toHaveBeenCalled();
    });
  });
});