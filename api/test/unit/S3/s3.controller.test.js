import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getPresignedUrl } from '../../../controllers/s3.controller.js';

// S3Client and PutObjectCommand are classes — must use function() not arrow fn
vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: vi.fn(function (config) {
    this.config = config;
  }),
  PutObjectCommand: vi.fn(function (input) {
    this.input = input;
  }),
}));

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn(),
}));

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('getPresignedUrl controller', () => {
  let req, res, next;

  beforeEach(() => {
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_ACCESS_KEY_ID = 'mockAccessKey';
    process.env.AWS_SECRET_ACCESS_KEY = 'mockSecretKey';
    process.env.AWS_BUCKET_NAME = 'my-bucket';

    req = {
      query: {
        fileName: 'car.jpg',
        fileType: 'image/jpeg',
      },
    };
    res = {
      json: vi.fn(),
    };
    next = vi.fn();

    vi.clearAllMocks();
  });

  // --- S3Client instantiation ---
  describe('S3Client setup', () => {
    it('should instantiate S3Client with correct region and credentials', async () => {
      getSignedUrl.mockResolvedValue('https://s3.amazonaws.com/bucket/mock-key?signed=true');

      await getPresignedUrl(req, res, next);

      expect(S3Client).toHaveBeenCalledWith({
        region: 'us-east-1',
        credentials: {
          accessKeyId: 'mockAccessKey',
          secretAccessKey: 'mockSecretKey',
        },
      });
    });
  });

  // --- PutObjectCommand ---
  describe('PutObjectCommand', () => {
    it('should create PutObjectCommand with correct bucket and content type', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({
          Bucket: 'my-bucket',
          ContentType: 'image/jpeg',
        })
      );
    });

    it('should generate a key that includes the original fileName', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      const commandArgs = PutObjectCommand.mock.calls[0][0];
      expect(commandArgs.Key).toMatch(/car\.jpg$/);
    });

    it('should prefix the key with a timestamp', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      const before = Date.now();
      await getPresignedUrl(req, res, next);
      const after = Date.now();

      const commandArgs = PutObjectCommand.mock.calls[0][0];
      const timestamp = Number(commandArgs.Key.split('-')[0]);

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
    });

    it('should generate a key matching the pattern timestamp-filename', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      const commandArgs = PutObjectCommand.mock.calls[0][0];
      expect(commandArgs.Key).toMatch(/^\d+-car\.jpg$/);
    });
  });

  // --- getSignedUrl ---
  describe('getSignedUrl', () => {
    it('should call getSignedUrl with expiresIn of 600 seconds', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      expect(getSignedUrl).toHaveBeenCalledWith(
        expect.any(S3Client),
        expect.any(PutObjectCommand),
        { expiresIn: 600 }
      );
    });

    it('should call getSignedUrl exactly once per request', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      expect(getSignedUrl).toHaveBeenCalledTimes(1);
    });
  });

  // --- Response ---
  describe('successful response', () => {
    it('should return the signed url in response', async () => {
      getSignedUrl.mockResolvedValue('https://s3.amazonaws.com/bucket/mock-key?signed=true');

      await getPresignedUrl(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          url: 'https://s3.amazonaws.com/bucket/mock-key?signed=true',
        })
      );
    });

    it('should return the generated key in response', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          key: expect.stringMatching(/^\d+-car\.jpg$/),
        })
      );
    });

    it('should return both url and key together', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      const jsonPayload = res.json.mock.calls[0][0];
      expect(jsonPayload).toHaveProperty('url');
      expect(jsonPayload).toHaveProperty('key');
    });

    it('should not call next on success', async () => {
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      expect(next).not.toHaveBeenCalled();
    });
  });

  // --- Query params ---
  describe('query param handling', () => {
    it('should use fileName from query params in the key', async () => {
      req.query.fileName = 'sports-car.png';
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      const commandArgs = PutObjectCommand.mock.calls[0][0];
      expect(commandArgs.Key).toMatch(/sports-car\.png$/);
    });

    it('should use fileType from query params as ContentType', async () => {
      req.query.fileType = 'image/png';
      getSignedUrl.mockResolvedValue('https://mock.url');

      await getPresignedUrl(req, res, next);

      expect(PutObjectCommand).toHaveBeenCalledWith(
        expect.objectContaining({ ContentType: 'image/png' })
      );
    });
  });

  // --- Error handling ---
  describe('error handling', () => {
    it('should call next with error if getSignedUrl throws', async () => {
      const s3Error = new Error('S3 signing failed');
      getSignedUrl.mockRejectedValue(s3Error);

      await getPresignedUrl(req, res, next);

      expect(next).toHaveBeenCalledWith(s3Error);
      expect(res.json).not.toHaveBeenCalled();
    });

  });
});