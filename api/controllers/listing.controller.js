import Listing from '../models/listing.model.js';
import { errorHandler } from '../utils/error.js';

export const createListing = async (req, res, next) => {
  try {
    const listing = await Listing.create(req.body);
    return res.status(201).json(listing);
  } catch (error) {
    next(error);
  }
};

export const deleteListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);

  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }

  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only delete your own listings!'));
  }

  try {
    await Listing.findByIdAndDelete(req.params.id);
    res.status(200).json('Listing has been deleted!');
  } catch (error) {
    next(error);
  }
};

export const updateListing = async (req, res, next) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    return next(errorHandler(404, 'Listing not found!'));
  }
  if (req.user.id !== listing.userRef) {
    return next(errorHandler(401, 'You can only update your own listings!'));
  }

  try {
    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.status(200).json(updatedListing);
  } catch (error) {
    next(error);
  }
};

export const getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(errorHandler(404, 'Listing not found!'));
    }
    res.status(200).json(listing);
  } catch (error) {
    next(error);
  }
  
  }

  export const getListings = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 9;
    const startIndex = parseInt(req.query.startIndex) || 0;

    // --- Offer filter ---
    let offer = req.query.offer;
    if (offer === undefined || offer === 'false') {
      offer = { $in: [false, true] };
    }

    // --- Type filter (sale / rent / all) ---
    let type = req.query.type;
    if (type === undefined || type === 'all') {
      type = { $in: ['sale', 'rent'] };
    }

    // --- Fuel type filter (petrol / diesel / all) ---
    let fuelType = req.query.fuelType;
    if (fuelType === undefined || fuelType === 'all') {
      fuelType = { $in: ['petrol', 'diesel'] };
    }

    // --- Year of manufacture range filter ---
    let yomFilter = {};
    const yomMin = parseInt(req.query.yomMin);
    const yomMax = parseInt(req.query.yomMax);
    if (!isNaN(yomMin)) yomFilter.$gte = yomMin;
    if (!isNaN(yomMax)) yomFilter.$lte = yomMax;

    // --- Engine search (partial match) ---
    const engineTerm = req.query.engine || '';

    // --- Name / general search term ---
    const searchTerm = req.query.searchTerm || '';

    // --- Sorting ---
    const sort = req.query.sort || 'createdAt';
    const order = req.query.order || 'desc';

    const query = {
      name: { $regex: searchTerm, $options: 'i' },
      offer,
      type,
      fuelType,
    };

    if (engineTerm) {
      query.engine = { $regex: engineTerm, $options: 'i' };
    }

    if (Object.keys(yomFilter).length > 0) {
      query.yom = yomFilter;
    }

    const listings = await Listing.find(query)
      .sort({ [sort]: order })
      .limit(limit)
      .skip(startIndex);

    return res.status(200).json(listings);
  } catch (error) {
    next(error);
  }
};