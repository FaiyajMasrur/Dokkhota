// Dashboard page for Dokkhota showing user summary and quick links
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import skillService from '../services/skillService.js';
import creditService from '../services/creditService.js';
import bookingService from '../services/bookingService.js';
import { Link } from 'react-router-dom';

const DashboardPage = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [credits, setCredits] = useState({ creditBalance: 0, heldCredits: 0, availableBalance: 0 });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMyListings = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const [listingsResponse, creditsResponse, bookingsResponse] = await Promise.all([
          skillService.getMyListings(accessToken),
          creditService.getBalance(accessToken),
          bookingService.getBookings(accessToken),
        ]);
        setMyListings(listingsResponse.data.listings || []);
        setCredits(creditsResponse.data || { creditBalance: 0, heldCredits: 0, availableBalance: 0 });
        setBookings(bookingsResponse.data.bookings || []);
      } catch (error) {
        setMyListings([]);
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };
    loadMyListings();
  }, [accessToken, isAuthenticated]);

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='grid gap-6 md:grid-cols-3 mb-10'>
          <div className='bg-white rounded-3xl p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Welcome back</p>
            <h2 className='text-2xl font-semibold'>{user?.name || 'Guest'}</h2>
          </div>
          <div className='bg-white rounded-3xl p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Available credits</p>
            <h2 className='text-2xl font-semibold'>{credits.creditBalance ?? user?.creditBalance ?? 0}</h2>
          </div>
          <div className='bg-white rounded-3xl p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Held credits</p>
            <h2 className='text-2xl font-semibold'>{credits.heldCredits ?? user?.heldCredits ?? 0}</h2>
          </div>
        </div>

        <div className='bg-white rounded-3xl p-8 shadow-sm mb-10'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-semibold'>Dashboard</h1>
              <p className='text-gray-600'>Manage your profile, listings, and credit balance.</p>
            </div>
            <Link to='/create-listing' className='bg-green-600 text-white rounded-full px-5 py-3 hover:bg-green-700'>Create listing</Link>
          </div>

          <div className='grid gap-8 lg:grid-cols-[1fr_1fr]'>
            <div>
              <h2 className='text-xl font-semibold mb-4'>Your listings</h2>
              {loading ? (
              <p className='text-gray-600'>Loading your listings...</p>
            ) : myListings.length > 0 ? (
              <div className='grid gap-4'>
                {myListings.map((listing) => (
                  <div key={listing._id} className='border rounded-3xl p-4 flex items-center justify-between'>
                    <div>
                      <h3 className='font-semibold'>{listing.title}</h3>
                      <p className='text-sm text-gray-500'>{listing.category}</p>
                    </div>
                    <Link to={`/listing/${listing._id}`} className='text-green-700 hover:underline'>View</Link>
                  </div>
                ))}
              </div>
              ) : (
                <p className='text-gray-600'>You have not created any listings yet.</p>
              )}
            </div>

            <div>
              <h2 className='text-xl font-semibold mb-4'>Recent bookings</h2>
              {bookings.length > 0 ? (
                <div className='space-y-3'>
                  {bookings.map((booking) => (
                    <div key={booking._id} className='border rounded-3xl p-4'>
                      <div className='flex items-center justify-between'>
                        <div className='font-semibold capitalize'>{booking.status}</div>
                        <div className='text-sm text-gray-500'>{booking.creditCost} SC</div>
                      </div>
                      <div className='text-sm text-gray-500 mt-1'>{booking.preferredDate} at {booking.preferredTime}</div>
                      {booking.message && <div className='text-sm text-gray-600 mt-1'>{booking.message}</div>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600'>No bookings yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
