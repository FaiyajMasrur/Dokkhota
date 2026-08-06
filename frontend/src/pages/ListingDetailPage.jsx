// Skill listing detail page for Dokkhota showing listing details and provider info
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import skillService from '../services/skillService.js';
import reviewService from '../services/reviewService.js';

const ListingDetailPage = () => {
  const { listingId } = useParams();
  const { isAuthenticated } = useAuth();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);

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

  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await reviewService.getListingReviews(listingId);
        setReviews(res.data.reviews || []);
      } catch (e) { /* ignore */ }
    };
    loadReviews();
  }, [listingId]);

  if (loading) {
    return <div className='max-w-6xl mx-auto px-4 py-10'>Loading listing...</div>;
  }

  if (!listing) {
    return <div className='max-w-6xl mx-auto px-4 py-10'>Listing not found.</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <div className='flex flex-col gap-6 md:flex-row'>
            <div className='md:w-2/3'>
              <h1 className='text-3xl font-semibold mb-3'>{listing.title}</h1>
              <p className='text-gray-600 mb-4'>{listing.description}</p>
              <div className='grid gap-4 md:grid-cols-2 mb-6'>
                <div className='bg-slate-50 rounded-3xl p-4'>
                  <p className='text-sm text-gray-500'>Category</p>
                  <p className='font-semibold'>{listing.category}</p>
                </div>
                <div className='bg-slate-50 rounded-3xl p-4'>
                  <p className='text-sm text-gray-500'>Format</p>
                  <p className='font-semibold'>{listing.format}</p>
                </div>
                <div className='bg-slate-50 rounded-3xl p-4'>
                  <p className='text-sm text-gray-500'>Duration</p>
                  <p className='font-semibold'>{listing.durationMinutes} minutes</p>
                </div>
                <div className='bg-slate-50 rounded-3xl p-4'>
                  <p className='text-sm text-gray-500'>Credits</p>
                  <p className='font-semibold'>{listing.creditCost} SC</p>
                </div>
              </div>
              <div className='mb-6'>
                <p className='text-sm text-gray-500'>Proficiency level</p>
                <p className='font-semibold'>{listing.proficiencyLevel}</p>
              </div>
              <div className='mb-4'>
                <p className='text-sm text-gray-500'>Tags</p>
                <div className='flex flex-wrap gap-2 mt-2'>
                  {listing.tags?.map((tag) => (
                    <span key={tag} className='text-xs bg-gray-100 rounded-full px-3 py-1'>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className='text-sm text-gray-500 mb-2'>Availability</p>
                <div className='grid gap-2'>
                  {listing.availability?.length > 0 ? (
                    listing.availability.map((slot, index) => (
                      <div key={index} className='bg-slate-50 rounded-3xl p-4'>
                        <p className='font-medium'>{slot.day}</p>
                        <p className='text-gray-600'>{slot.slots.join(', ')}</p>
                      </div>
                    ))
                  ) : (
                    <p className='text-gray-600'>No availability details provided.</p>
                  )}
                </div>
              </div>
            </div>
            <aside className='md:w-1/3'>
              <div className='bg-slate-50 rounded-3xl p-6 space-y-4'>
                <div>
                  <p className='text-sm text-gray-500'>Provider</p>
                  <Link to={`/profile/${listing.teacherId}`} className='text-lg font-semibold text-green-700 hover:underline'>
                    View teacher profile
                  </Link>
                </div>
                <div>
                  <p className='text-sm text-gray-500'>Session fee</p>
                  <p className='text-2xl font-bold'>{listing.creditCost} SC</p>
                </div>
                <Link
                  to={isAuthenticated ? `/book/${listing._id}` : '/login'}
                  className='block w-full bg-green-700 text-white rounded-full px-4 py-3 hover:bg-green-800 text-center'
                >
                  {isAuthenticated ? 'Book session' : 'Log in to book'}
                </Link>
              </div>
            </aside>
          </div>

          {/* ── Reviews Section ──────────────────────────────────── */}
          <div className='mt-8 bg-white rounded-3xl p-8 shadow-sm'>
            <h3 className='text-xl font-semibold mb-4'>Reviews ({reviews.length})</h3>
            {reviews.length > 0 ? (
              <div className='space-y-4'>
                {reviews.map((review) => (
                  <div key={review._id} className='border rounded-2xl p-4'>
                    <div className='flex items-center justify-between mb-2'>
                      <div className='flex items-center gap-2'>
                        <div className='w-8 h-8 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-xs'>
                          {review.reviewerId?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className='font-medium text-sm'>{review.reviewerId?.name || 'Anonymous'}</span>
                      </div>
                      <span className='text-sm'>{'⭐'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
                    </div>
                    {review.comment && <p className='text-sm text-gray-600'>{review.comment}</p>}
                    <span className='text-xs text-gray-400'>{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-sm'>No reviews yet for this listing.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ListingDetailPage;
