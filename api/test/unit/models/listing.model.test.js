import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import Listing from '../../../models/listing.model.js';

beforeAll(async () => {
  await mongoose.connect('mongodb://127.0.0.1:27017/test_user_db');
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

beforeEach(async () => {
  await Listing.deleteMany({});
});

const validListing = {
  name: 'Toyota Camry',
  description: 'A reliable sedan',
  address: '123 Main St, Colombo',
  regularPrice: 25000,
  discountPrice: 22000,
  engine: '2.5L V6',
  yom: 2020,
  fuelType: 'Petrol',
  type: 'sedan',
  offer: true,
  imageUrls: ['http://img.url/car1.jpg'],
  userRef: 'user123',
};

describe('Listing Model — valid document', () => {
  it('should save a valid listing successfully', async () => {
    const listing = new Listing(validListing);
    const saved = await listing.save();

  expect(saved._id).toBeDefined();
  expect(saved.name).toBe('Toyota Camry');
  expect(saved.description).toBe('A reliable sedan');
  expect(saved.address).toBe('123 Main St, Colombo');
  expect(saved.regularPrice).toBe(25000);
  expect(saved.discountPrice).toBe(22000);
  expect(saved.engine).toBe('2.5L V6');
  expect(saved.yom).toBe(2020);
  expect(saved.fuelType).toBe('Petrol');
  expect(saved.type).toBe('sedan');
  expect(saved.offer).toBe(true);
  expect(saved.imageUrls).toHaveLength(1);              // ← fixed
  expect(saved.imageUrls[0]).toBe('http://img.url/car1.jpg'); // ← fixed
  expect(saved.userRef).toBe('user123');
  });

  it('should add createdAt and updatedAt timestamps', async () => {
    const listing = new Listing(validListing);
    const saved = await listing.save();

    expect(saved.createdAt).toBeDefined();
    expect(saved.updatedAt).toBeDefined();
  });
});

describe('Listing Model — required fields', () => {
  const requiredFields = [
    'name',
    'description',
    'address',
    'regularPrice',
    'discountPrice',
    'engine',
    'yom',
    'fuelType',
    'type',
    'offer',
    'userRef',
  ];

  requiredFields.forEach((field) => {
    it(`should fail validation when "${field}" is missing`, async () => {
      const data = { ...validListing };
      delete data[field];

      const listing = new Listing(data);

      await expect(listing.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });
  });
});

describe('Listing Model — field types', () => {
  it('should store regularPrice as a Number', async () => {
    const listing = new Listing(validListing);
    const saved = await listing.save();
    expect(typeof saved.regularPrice).toBe('number');
  });

  it('should store discountPrice as a Number', async () => {
    const listing = new Listing(validListing);
    const saved = await listing.save();
    expect(typeof saved.discountPrice).toBe('number');
  });

  it('should store yom as a Number', async () => {
    const listing = new Listing(validListing);
    const saved = await listing.save();
    expect(typeof saved.yom).toBe('number');
  });

  it('should store offer as a Boolean', async () => {
    const listing = new Listing(validListing);
    const saved = await listing.save();
    expect(typeof saved.offer).toBe('boolean');
  });

 it('should save with empty imageUrls when field is omitted (Array type defaults to [])', async () => {
  const data = { ...validListing };
  delete data['imageUrls'];
  const listing = new Listing(data);
  const saved = await listing.save();
  expect(Array.isArray(saved.imageUrls)).toBe(true);
  expect(saved.imageUrls).toHaveLength(0);
});

  it('should store multiple imageUrls', async () => {
    const listing = new Listing({
      ...validListing,
      imageUrls: ['http://img.url/car1.jpg', 'http://img.url/car2.jpg'],
    });
    const saved = await listing.save();
    expect(saved.imageUrls).toHaveLength(2);
  });
});

describe('Listing Model — offer flag', () => {
  it('should save with offer set to false', async () => {
    const listing = new Listing({ ...validListing, offer: false });
    const saved = await listing.save();
    expect(saved.offer).toBe(false);
  });

  it('should save with offer set to true', async () => {
    const listing = new Listing({ ...validListing, offer: true });
    const saved = await listing.save();
    expect(saved.offer).toBe(true);
  });
});