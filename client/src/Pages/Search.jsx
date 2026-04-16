import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import ListingItem from '../components/ListingItem';

export default function Search() {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarData, setSidebarData] = useState({
    searchTerm: '',
    type: 'all',
    offer: false,
    fuelType: 'all',
    engine: '',
    yomMin: '',
    yomMax: '',
    sort: 'createdAt',
    order: 'desc',
  });

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const typeFromUrl = urlParams.get('type');
    const offerFromUrl = urlParams.get('offer');
    const fuelTypeFromUrl = urlParams.get('fuelType');
    const engineFromUrl = urlParams.get('engine');
    const yomMinFromUrl = urlParams.get('yomMin');
    const yomMaxFromUrl = urlParams.get('yomMax');
    const sortFromUrl = urlParams.get('sort');
    const orderFromUrl = urlParams.get('order');

    if (
      searchTermFromUrl ||
      typeFromUrl ||
      offerFromUrl ||
      fuelTypeFromUrl ||
      engineFromUrl ||
      yomMinFromUrl ||
      yomMaxFromUrl ||
      sortFromUrl ||
      orderFromUrl
    ) {
      setSidebarData({
        searchTerm: searchTermFromUrl || '',
        type: typeFromUrl || 'all',
        offer: offerFromUrl === 'true' ? true : false,
        fuelType: fuelTypeFromUrl || 'all',
        engine: engineFromUrl || '',
        yomMin: yomMinFromUrl || '',
        yomMax: yomMaxFromUrl || '',
        sort: sortFromUrl || 'createdAt',
        order: orderFromUrl || 'desc',
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      setShowMore(false);
      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      if (data.length > 8) {
        setShowMore(true);
      } else {
        setShowMore(false);
      }
      setListings(data);
      setLoading(false);
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    // Type checkboxes
    if (['all', 'rent', 'sale'].includes(e.target.id)) {
      setSidebarData({ ...sidebarData, type: e.target.id });
    }

    // Search term, engine, yomMin, yomMax
    if (
      e.target.type === 'text' ||
      e.target.type === 'number'
    ) {
      setSidebarData({ ...sidebarData, [e.target.id]: e.target.value });
    }

    // Offer checkbox
    if (e.target.id === 'offer') {
      setSidebarData({
        ...sidebarData,
        offer: e.target.checked || e.target.checked === true ? true : false,
      });
    }

    // Fuel type & sort dropdowns
    if (e.target.id === 'fuelType' || e.target.id === 'sort_order') {
      if (e.target.id === 'sort_order') {
        const sort = e.target.value.split('_')[0] || 'createdAt';
        const order = e.target.value.split('_')[1] || 'desc';
        setSidebarData({ ...sidebarData, sort, order });
      } else {
        setSidebarData({ ...sidebarData, fuelType: e.target.value });
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set('searchTerm', sidebarData.searchTerm);
    urlParams.set('type', sidebarData.type);
    urlParams.set('offer', sidebarData.offer);
    urlParams.set('fuelType', sidebarData.fuelType);
    if (sidebarData.engine) urlParams.set('engine', sidebarData.engine);
    if (sidebarData.yomMin) urlParams.set('yomMin', sidebarData.yomMin);
    if (sidebarData.yomMax) urlParams.set('yomMax', sidebarData.yomMax);
    urlParams.set('sort', sidebarData.sort);
    urlParams.set('order', sidebarData.order);
    const searchQuery = urlParams.toString();
    navigate(`/search?${searchQuery}`);
  };

  const onShowMoreClick = async () => {
    const numberOfListings = listings.length;
    const startIndex = numberOfListings;
    const urlParams = new URLSearchParams(location.search);
    urlParams.set('startIndex', startIndex);
    const searchQuery = urlParams.toString();
    const res = await fetch(`/api/listing/get?${searchQuery}`);
    const data = await res.json();
    if (data.length < 9) {
      setShowMore(false);
    }
    setListings([...listings, ...data]);
  };

  return (
    <div className='flex flex-col md:flex-row'>
      {/* ── Sidebar ── */}
      <div className='p-7 border-b-2 md:border-r-2 md:min-h-screen'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>

          {/* Search term */}
          <div className='flex items-center gap-2'>
            <label className='whitespace-nowrap font-semibold'>Search Term:</label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='border rounded-lg p-3 w-full'
              value={sidebarData.searchTerm}
              onChange={handleChange}
            />
          </div>

          {/* Type */}
          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Type:</label>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='all'
                className='w-5'
                onChange={handleChange}
                checked={sidebarData.type === 'all'}
              />
              <span>Rent &amp; Sale</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='rent'
                className='w-5'
                onChange={handleChange}
                checked={sidebarData.type === 'rent'}
              />
              <span>Rent</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='sale'
                className='w-5'
                onChange={handleChange}
                checked={sidebarData.type === 'sale'}
              />
              <span>Sale</span>
            </div>
            <div className='flex gap-2'>
              <input
                type='checkbox'
                id='offer'
                className='w-5'
                onChange={handleChange}
                checked={sidebarData.offer}
              />
              <span>Offer</span>
            </div>
          </div>

          {/* Fuel Type */}
          <div className='flex items-center gap-2'>
            <label className='font-semibold'>Fuel Type:</label>
            <select
              id='fuelType'
              className='border rounded-lg p-3'
              onChange={handleChange}
              value={sidebarData.fuelType}
            >
              <option value='all'>All</option>
              <option value='petrol'>Petrol</option>
              <option value='diesel'>Diesel</option>
            </select>
          </div>

          {/* Engine */}
          <div className='flex items-center gap-2'>
            <label className='whitespace-nowrap font-semibold'>Engine:</label>
            <input
              type='text'
              id='engine'
              placeholder='e.g. V6, 2.0T...'
              className='border rounded-lg p-3 w-full'
              value={sidebarData.engine}
              onChange={handleChange}
            />
          </div>

          {/* YOM Range */}
          <div className='flex items-center gap-2 flex-wrap'>
            <label className='whitespace-nowrap font-semibold'>Year (YOM):</label>
            <input
              type='number'
              id='yomMin'
              placeholder='Min'
              className='border rounded-lg p-3 w-24'
              value={sidebarData.yomMin}
              onChange={handleChange}
            />
            <span className='text-slate-500'>–</span>
            <input
              type='number'
              id='yomMax'
              placeholder='Max'
              className='border rounded-lg p-3 w-24'
              value={sidebarData.yomMax}
              onChange={handleChange}
            />
          </div>

          {/* Sort */}
          <div className='flex items-center gap-2'>
            <label className='font-semibold'>Sort:</label>
            <select
              id='sort_order'
              className='border rounded-lg p-3'
              onChange={handleChange}
              defaultValue={'createdAt_desc'}
            >
              <option value='regularPrice_desc'>Price high to low</option>
              <option value='regularPrice_asc'>Price low to high</option>
              <option value='createdAt_desc'>Latest</option>
              <option value='createdAt_asc'>Oldest</option>
            </select>
          </div>

          <button className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95'>
            Search
          </button>
        </form>
      </div>

      {/* ── Results ── */}
      <div className='flex-1'>
        <h1 className='text-3xl font-semibold border-b p-3 text-slate-700 mt-5'>
          Listing results:
        </h1>
        <div className='p-7 flex flex-wrap gap-4'>
          {!loading && listings.length === 0 && (
            <p className='text-xl text-slate-700'>No listings found!</p>
          )}
          {loading && (
            <p className='text-xl text-slate-700 text-center w-full'>Loading...</p>
          )}
          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}
          {showMore && (
            <button
              onClick={onShowMoreClick}
              className='text-green-700 hover:underline p-7 text-center w-full'
            >
              Show more
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
