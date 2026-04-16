import React from 'react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ListingItem from '../components/ListingItem';

export default function Search() {
  const navigate = useNavigate();
  const [sidebardata, setSidebardata] = useState({
    searchTerm: '',
    type: 'all',
    fuelType: 'all',
    offer: false,
    yomMin: '',
    yomMax: '',
    engine: '',
    sort: 'createdAt',
    order: 'desc',
  });

  const [loading, setLoading] = useState(false);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const searchTermFromUrl = urlParams.get('searchTerm');
    const typeFromUrl = urlParams.get('type');
    const fuelTypeFromUrl = urlParams.get('fuelType');
    const offerFromUrl = urlParams.get('offer');
    const yomMinFromUrl = urlParams.get('yomMin');
    const yomMaxFromUrl = urlParams.get('yomMax');
    const engineFromUrl = urlParams.get('engine');
    const sortFromUrl = urlParams.get('sort');
    const orderFromUrl = urlParams.get('order');

    if (
      searchTermFromUrl ||
      typeFromUrl ||
      fuelTypeFromUrl ||
      offerFromUrl ||
      yomMinFromUrl ||
      yomMaxFromUrl ||
      engineFromUrl ||
      sortFromUrl ||
      orderFromUrl
    ) {
      setSidebardata({
        searchTerm: searchTermFromUrl || '',
        type: typeFromUrl || 'all',
        fuelType: fuelTypeFromUrl || 'all',
        offer: offerFromUrl === 'true' ? true : false,
        yomMin: yomMinFromUrl || '',
        yomMax: yomMaxFromUrl || '',
        engine: engineFromUrl || '',
        sort: sortFromUrl || 'createdAt',
        order: orderFromUrl || 'desc',
      });
    }

    const fetchListings = async () => {
      setLoading(true);
      const searchQuery = urlParams.toString();
      const res = await fetch(`/api/listing/get?${searchQuery}`);
      const data = await res.json();
      setListings(data);
      setLoading(false);
    };

    fetchListings();
  }, [location.search]);

  const handleChange = (e) => {
    // Listing type checkboxes
    if (e.target.id === 'all' || e.target.id === 'rent' || e.target.id === 'sale') {
      setSidebardata({ ...sidebardata, type: e.target.id });
    }

    // Search term & engine text inputs
    if (e.target.id === 'searchTerm' || e.target.id === 'engine') {
      setSidebardata({ ...sidebardata, [e.target.id]: e.target.value });
    }

    // Offer checkbox
    if (e.target.id === 'offer') {
      setSidebardata({ ...sidebardata, offer: e.target.checked });
    }

    // Fuel type checkboxes
    if (e.target.id === 'fuelAll' || e.target.id === 'petrol' || e.target.id === 'diesel') {
      setSidebardata({
        ...sidebardata,
        fuelType: e.target.id === 'fuelAll' ? 'all' : e.target.id,
      });
    }

    // YOM range inputs
    if (e.target.id === 'yomMin' || e.target.id === 'yomMax') {
      setSidebardata({ ...sidebardata, [e.target.id]: e.target.value });
    }

    // Sort & order
    if (e.target.id === 'sort_order') {
      const sort = e.target.value.split('_')[0] || 'createdAt';
      const order = e.target.value.split('_')[1] || 'desc';
      setSidebardata({ ...sidebardata, sort, order });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const urlParams = new URLSearchParams();
    urlParams.set('searchTerm', sidebardata.searchTerm);
    urlParams.set('type', sidebardata.type);
    urlParams.set('fuelType', sidebardata.fuelType);
    urlParams.set('offer', sidebardata.offer);
    if (sidebardata.yomMin) urlParams.set('yomMin', sidebardata.yomMin);
    if (sidebardata.yomMax) urlParams.set('yomMax', sidebardata.yomMax);
    if (sidebardata.engine) urlParams.set('engine', sidebardata.engine);
    urlParams.set('sort', sidebardata.sort);
    urlParams.set('order', sidebardata.order);
    navigate(`/search?${urlParams.toString()}`);
  };

  return (
    <div className='flex flex-col md:flex-row'>
      <div className='p-7 border-b-2 md:border-r-2 md:min-h-screen'>
        <form onSubmit={handleSubmit} className='flex flex-col gap-8'>

          {/* Search Term */}
          <div className='flex items-center gap-2'>
            <label className='whitespace-nowrap font-semibold'>Search Term:</label>
            <input
              type='text'
              id='searchTerm'
              placeholder='Search...'
              className='border rounded-lg p-3 w-full'
              value={sidebardata.searchTerm}
              onChange={handleChange}
            />
          </div>

          {/* Listing Type */}
          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Type:</label>
            <div className='flex gap-2'>
              <input type='checkbox' id='all' className='w-5'
                onChange={handleChange}
                checked={sidebardata.type === 'all'}
              />
              <span>Rent & Sale</span>
            </div>
            <div className='flex gap-2'>
              <input type='checkbox' id='rent' className='w-5'
                onChange={handleChange}
                checked={sidebardata.type === 'rent'}
              />
              <span>Rent</span>
            </div>
            <div className='flex gap-2'>
              <input type='checkbox' id='sale' className='w-5'
                onChange={handleChange}
                checked={sidebardata.type === 'sale'}
              />
              <span>Sale</span>
            </div>
            <div className='flex gap-2'>
              <input type='checkbox' id='offer' className='w-5'
                onChange={handleChange}
                checked={sidebardata.offer}
              />
              <span>Offer</span>
            </div>
          </div>

          {/* Fuel Type */}
          <div className='flex gap-2 flex-wrap items-center'>
            <label className='font-semibold'>Fuel Type:</label>
            <div className='flex gap-2'>
              <input type='checkbox' id='fuelAll' className='w-5'
                onChange={handleChange}
                checked={sidebardata.fuelType === 'all'}
              />
              <span>All</span>
            </div>
            <div className='flex gap-2'>
              <input type='checkbox' id='petrol' className='w-5'
                onChange={handleChange}
                checked={sidebardata.fuelType === 'petrol'}
              />
              <span>Petrol</span>
            </div>
            <div className='flex gap-2'>
              <input type='checkbox' id='diesel' className='w-5'
                onChange={handleChange}
                checked={sidebardata.fuelType === 'diesel'}
              />
              <span>Diesel</span>
            </div>
          </div>

          {/* Year of Manufacture Range */}
          <div className='flex flex-col gap-2'>
            <label className='font-semibold'>Year of Manufacture:</label>
            <div className='flex items-center gap-3'>
              <input
                type='number'
                id='yomMin'
                placeholder='From (e.g. 2010)'
                className='border rounded-lg p-3 w-full'
                value={sidebardata.yomMin}
                onChange={handleChange}
                min='1900'
                max={new Date().getFullYear()}
              />
              <span className='font-semibold text-slate-500'>—</span>
              <input
                type='number'
                id='yomMax'
                placeholder={`To (e.g. ${new Date().getFullYear()})`}
                className='border rounded-lg p-3 w-full'
                value={sidebardata.yomMax}
                onChange={handleChange}
                min='1900'
                max={new Date().getFullYear()}
              />
            </div>
          </div>

          {/* Engine Search */}
          <div className='flex items-center gap-2'>
            <label className='whitespace-nowrap font-semibold'>Engine:</label>
            <input
              type='text'
              id='engine'
              placeholder='e.g. V6, 2.0L...'
              className='border rounded-lg p-3 w-full'
              value={sidebardata.engine}
              onChange={handleChange}
            />
          </div>

          {/* Sort */}
          <div className='flex items-center gap-2'>
            <label className='font-semibold'>Sort:</label>
            <select
              onChange={handleChange}
              value={`${sidebardata.sort}_${sidebardata.order}`}
              id='sort_order'
              className='border rounded-lg p-3'
            >
              <option value='regularPrice_desc'>Price high to low</option>
              <option value='regularPrice_asc'>Price low to high</option>
              <option value='createdAt_desc'>Latest</option>
              <option value='createdAt_asc'>Oldest</option>
              <option value='yom_desc'>Newest model</option>
              <option value='yom_asc'>Oldest model</option>
            </select>
          </div>

          <button className='bg-slate-700 text-white p-3 rounded-lg uppercase hover:opacity-95'>
            Search
          </button>
        </form>
      </div>

      {/* Results panel */}
      <div className='flex-1'>
        <h1 className='text-3xl font-semibold border-b p-3 text-slate-700 mt-5'>
          Listing results:
        </h1>
       <div className='p-7 flex flex-wrap gap-4'>
          {!loading && listings.length === 0 && (
            <p className='text-xl text-slate-700'>No listing found!</p>
          )}
          {loading && (
            <p className='text-xl text-slate-700 text-center w-full'>
              Loading...
            </p>
          )}

          {!loading &&
            listings &&
            listings.map((listing) => (
              <ListingItem key={listing._id} listing={listing} />
            ))}
        </div>
      </div>
    </div>
  );
}
