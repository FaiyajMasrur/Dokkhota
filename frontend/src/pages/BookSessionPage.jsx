// Booking page for Dokkhota session requests
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import skillService from '../services/skillService.js';
import bookingService from '../services/bookingService.js';

const BookSessionPage = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const loadListing = async () => {
      try {
        const response = await skillService.getListing(listingId);
        setListing(response.data.listing);
      } catch (error) {
        setListing(null);
      } finally {
        setLoading(false);
      }
    };
    loadListing();
  }, [listingId]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setStatus('Please log in before requesting a booking.');
      return;
    }
    if (!selectedDate || !selectedTime) {
      setStatus('Please choose a date and time for your request.');
      return;
    }

    try {
      const response = await bookingService.createBooking(
        {
          listingId,
          preferredDate: selectedDate,
          preferredTime: selectedTime,
          message,
        },
        accessToken
      );

      if (response.data?.success) {
        setStatus('Booking request submitted successfully.');
        setTimeout(() => navigate('/dashboard'), 1200);
      }
    } catch (error) {
      setStatus(error.response?.data?.message || 'Could not submit booking request.');
    }
  };

  if (loading) {
    return <div className='max-w-4xl mx-auto px-4 py-10'>Loading booking details...</div>;
  }

  if (!listing) {
    return <div className='max-w-4xl mx-auto px-4 py-10'>Could not find listing <strong>{listingId}</strong>.</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-4xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl shadow-sm p-8'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8'>
            <div>
              <h1 className='text-3xl font-semibold'>Book a session</h1>
              <p className='text-gray-600'>Request a session for <strong>{listing.title}</strong>.</p>
            </div>
            <Link to={`/listing/${listingId}`} className='text-green-700 hover:underline'>Back to listing</Link>
          </div>

          <div className='grid gap-6 lg:grid-cols-[1fr_320px]'>
            <section>
              <div className='bg-slate-50 rounded-3xl p-6 mb-6'>
                <p className='text-sm text-gray-500'>Provider</p>
                <p className='text-lg font-semibold'>{listing.teacherId?.name || listing.teacherId || 'Teacher'}</p>
                <p className='text-sm text-gray-500'>Fee: {listing.creditCost} SC</p>
              </div>
              <form className='space-y-4' onSubmit={handleSubmit}>
                <div>
                  <label className='block text-sm font-medium mb-2'>Preferred date</label>
                  <input type='date' value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className='w-full border rounded px-4 py-3' />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-2'>Preferred time</label>
                  <input type='time' value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} className='w-full border rounded px-4 py-3' />
                </div>
                <div>
                  <label className='block text-sm font-medium mb-2'>Message for the provider</label>
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} className='w-full border rounded px-4 py-3' rows={4} placeholder='Tell the provider a bit about your goal or questions.' />
                </div>
                <button type='submit' className='w-full bg-green-600 text-white rounded-full px-6 py-3 hover:bg-green-700'>Request booking</button>
              </form>
              {status && <p className={`mt-4 ${status.includes('success') || status.includes('submitted') ? 'text-green-700' : 'text-red-600'}`}>{status}</p>}
            </section>

            <aside className='bg-white rounded-3xl p-6 border'>
              <h2 className='text-xl font-semibold mb-4'>Listing summary</h2>
              <p className='text-gray-600 mb-3'>{listing.description}</p>
              <div className='space-y-3 text-sm text-gray-700'>
                <div>
                  <span className='font-semibold'>Category:</span> {listing.category}
                </div>
                <div>
                  <span className='font-semibold'>Mode:</span> {listing.format}
                </div>
                <div>
                  <span className='font-semibold'>Duration:</span> {listing.durationMinutes} minutes
                </div>
                <div>
                  <span className='font-semibold'>Level:</span> {listing.proficiencyLevel}</div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookSessionPage;
