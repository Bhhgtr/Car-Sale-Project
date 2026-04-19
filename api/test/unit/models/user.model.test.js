import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import User from '../../../models/user.models.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_user_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await User.deleteMany({});
});

const validUser = {
  username: 'testuser',
  email: 'test@test.com',
  password: 'hashedpassword123',
};

describe('User Model — valid document', () => {
  it('should save a valid user successfully', async () => {
    const user = new User(validUser);
    const saved = await user.save();

    expect(saved._id).toBeDefined();
    expect(saved.username).toBe('testuser');
    expect(saved.email).toBe('test@test.com');
    expect(saved.password).toBe('hashedpassword123');
  });

  it('should add createdAt and updatedAt timestamps', async () => {
    const user = new User(validUser);
    const saved = await user.save();

    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });

  it('should apply default avatar when none is provided', async () => {
    const user = new User(validUser);
    const saved = await user.save();

    expect(saved.avatar).toBeDefined();
    expect(typeof saved.avatar).toBe('string');
    expect(saved.avatar.length).toBeGreaterThan(0);
  });

  it('should save a custom avatar when provided', async () => {
    const user = new User({ ...validUser, avatar: 'http://custom.url/avatar.jpg' });
    const saved = await user.save();

    expect(saved.avatar).toBe('http://custom.url/avatar.jpg');
  });
});

describe('User Model — required fields', () => {
  const requiredFields = ['username', 'email', 'password'];

  requiredFields.forEach((field) => {
    it(`should fail validation when "${field}" is missing`, async () => {
      const data = { ...validUser };
      delete data[field];

      const user = new User(data);

      await expect(user.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });
});

describe('User Model — unique fields', () => {
  it('should not allow duplicate usernames', async () => {
    await new User(validUser).save();

    const duplicate = new User({ ...validUser, email: 'other@test.com' });

    await expect(duplicate.save()).rejects.toThrow();
  });

  it('should not allow duplicate emails', async () => {
    await new User(validUser).save();

    const duplicate = new User({ ...validUser, username: 'otheruser' });

    await expect(duplicate.save()).rejects.toThrow();
  });

  it('should allow two users with different username and email', async () => {
    await new User(validUser).save();

    const second = new User({
      username: 'seconduser',
      email: 'second@test.com',
      password: 'hashedpassword456',
    });
    const saved = await second.save();

    expect(saved._id).toBeDefined();
  });
});

describe('User Model — field types', () => {
  it('should store username as a String', async () => {
    const user = new User(validUser);
    const saved = await user.save();
    expect(typeof saved.username).toBe('string');
  });

  it('should store email as a String', async () => {
    const user = new User(validUser);
    const saved = await user.save();
    expect(typeof saved.email).toBe('string');
  });

  it('should store password as a String', async () => {
    const user = new User(validUser);
    const saved = await user.save();
    expect(typeof saved.password).toBe('string');
  });
});