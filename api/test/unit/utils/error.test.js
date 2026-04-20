import { describe, it, expect } from 'vitest';
import { errorHandler } from '../../../utils/error.js';

describe('errorHandler utility', () => {
  describe('return type', () => {
    it('should return an instance of Error', () => {
      const error = errorHandler(404, 'Not found');
      expect(error).toBeInstanceOf(Error);
    });

    it('should return a new Error object on each call', () => {
      const error1 = errorHandler(404, 'Not found');
      const error2 = errorHandler(404, 'Not found');
      expect(error1).not.toBe(error2);
    });
  });

  describe('statusCode', () => {
    it('should set statusCode to 404', () => {
      const error = errorHandler(404, 'Not found');
      expect(error.statusCode).toBe(404);
    });

    it('should set statusCode to 401', () => {
      const error = errorHandler(401, 'Unauthorized');
      expect(error.statusCode).toBe(401);
    });

    it('should set statusCode to 403', () => {
      const error = errorHandler(403, 'Forbidden');
      expect(error.statusCode).toBe(403);
    });

    it('should set statusCode to 500', () => {
      const error = errorHandler(500, 'Internal Server Error');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('message', () => {
    it('should set the correct message', () => {
      const error = errorHandler(404, 'Not found');
      expect(error.message).toBe('Not found');
    });

    it('should set an empty message when passed an empty string', () => {
      const error = errorHandler(400, '');
      expect(error.message).toBe('');
    });

    it('should handle long messages', () => {
      const longMessage = 'A'.repeat(500);
      const error = errorHandler(400, longMessage);
      expect(error.message).toBe(longMessage);
    });
  });

  describe('statusCode and message together', () => {
    it('should correctly set both statusCode and message independently per call', () => {
      const notFound = errorHandler(404, 'Not found');
      const serverError = errorHandler(500, 'Server error');

      expect(notFound.statusCode).toBe(404);
      expect(notFound.message).toBe('Not found');
      expect(serverError.statusCode).toBe(500);
      expect(serverError.message).toBe('Server error');
    });
  });
});