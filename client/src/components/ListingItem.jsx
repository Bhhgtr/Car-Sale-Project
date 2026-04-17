import { Link } from 'react-router-dom';
import { MdLocationOn } from 'react-icons/md';
import { FaGasPump, FaCar } from 'react-icons/fa';

export default function ListingItem({ listing }) {
  return (
    <div className='bg-white shadow-md hover:shadow-lg transition-shadow overflow-hidden rounded-lg w-full sm:w-[330px]'>
      <Link to={`/listing/${listing._id}`}>
        <img
          src={
            listing.imageUrls[0] ||
            'https://auto.economictimes.indiatimes.com/news/passenger-vehicle/mercedes-benz-india-launches-top-end-amg-glc-43-4matic-coup-and-cle-300-cabriolet-amg-line/112374082'
          }
          alt='listing cover'
          className='h-[320px] sm:h-[220px] w-full object-cover hover:scale-105 transition-scale duration-300'
        />
        <div className='p-3 flex flex-col gap-2 w-full'>

          {/* Name */}
          <p className='truncate text-lg font-semibold text-slate-700'>
            {listing.name}
          </p>

          {/* Address */}
          <div className='flex items-center gap-1'>
            <MdLocationOn className='h-4 w-4 text-green-700 shrink-0' />
            <p className='text-sm text-gray-600 truncate w-full'>
              {listing.address}
            </p>
          </div>

          {/* Description */}
          <p className='text-sm text-gray-600 line-clamp-2'>
            {listing.description}
          </p>

          {/* Price */}
          <p className='text-slate-500 mt-2 font-semibold'>
            $
            {listing.offer
              ? +listing.regularPrice - +listing.discountPrice
              : listing.regularPrice.toLocaleString('en-US')}
            {listing.type === 'rent' && ' / month'}
          </p>

          {/* Vehicle details */}
          <div className='text-slate-700 flex gap-4 flex-wrap'>
            <div className='flex items-center gap-1 font-bold text-xs'>
              <FaCar className='text-slate-500' />
              {listing.engine}
            </div>
            <div className='flex items-center gap-1 font-bold text-xs'>
              <FaCar className='text-slate-500' />
              {listing.yom}
            </div>
            <div className='flex items-center gap-1 font-bold text-xs'>
              <FaGasPump className='text-slate-500' />
              {listing.fuelType.charAt(0).toUpperCase() + listing.fuelType.slice(1)}
            </div>
          </div>

        </div>
      </Link>
    </div>
  );
}
