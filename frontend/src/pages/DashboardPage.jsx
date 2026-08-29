// Dashboard page for Dokkhota — Features 6 & 9: Session management + Reviews
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import skillService from '../services/skillService.js';
import creditService from '../services/creditService.js';
import bookingService from '../services/bookingService.js';
import reviewService from '../services/reviewService.js';
import { Link } from 'react-router-dom';

// ── Status badge colors ────────────────────────────────────────────────
const STATUS_STYLES = {
  pending:   'bg-yellow-100 text-yellow-800',
  accepted:  'bg-blue-100 text-blue-800',
  rejected:  'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-600',
  completed: 'bg-green-100 text-green-800',
};

// ── Review button with inline star rating ──────────────────────────────
const ReviewButton = ({ bookingId }) => {
  const { accessToken } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await reviewService.checkReview(bookingId, accessToken);
        if (res.data.hasReviewed) setAlreadyReviewed(true);
      } catch (e) { /* ignore */ }
    };
    check();
  }, [bookingId, accessToken]);

  const handleSubmit = async () => {
    if (rating === 0) return;
    setSubmitting(true);
    try {
      await reviewService.createReview({ bookingId, rating, comment }, accessToken);
      setSubmitted(true);
      setShowForm(false);
    } catch (e) {
      console.error('Review submit error:', e);
    } finally {
      setSubmitting(false);
    }
  };

  if (alreadyReviewed || submitted) {
    return <span className='text-xs text-green-600 font-medium py-2'>✓ Reviewed</span>;
  }

  if (showForm) {
    return (
      <div className='w-full mt-3 p-4 border rounded-xl bg-slate-50 space-y-3'>
        <p className='text-sm font-medium text-gray-700'>Rate this session</p>
        <div className='flex gap-1'>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type='button'
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className='text-2xl transition-transform hover:scale-110'
            >
              {star <= (hoverRating || rating) ? '⭐' : '☆'}
            </button>
          ))}
        </div>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder='Write a short review (optional)...'
          className='w-full border rounded-xl px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-green-600'
        />
        <div className='flex gap-2'>
          <button
            onClick={handleSubmit}
            disabled={rating === 0 || submitting}
            className='px-4 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition'
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
          <button
            onClick={() => setShowForm(false)}
            className='px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition'
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowForm(true)}
      className='px-4 py-2 text-sm font-medium rounded-xl bg-yellow-500 text-white hover:bg-yellow-600 transition flex items-center gap-1.5'
    >
      ⭐ Leave Review
    </button>
  );
};

// ── Single booking card ────────────────────────────────────────────────
const BookingCard = ({ booking, userId, onStatusChange, actionLoading }) => {
  const isTeacher = booking.teacherId?._id === userId || booking.teacherId === userId;
  const isStudent = booking.studentId?._id === userId || booking.studentId === userId;
  const otherPerson = isTeacher ? booking.studentId : booking.teacherId;
  const role = isTeacher ? 'Teaching' : 'Learning';

  const listingTitle = booking.listingId?.title || 'Untitled session';
  const category = booking.listingId?.category || '';

  return (
    <div className='border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow'>
      {/* Header row */}
      <div className='flex items-start justify-between mb-3'>
        <div>
          <h3 className='font-semibold text-gray-900'>{listingTitle}</h3>
          {category && <p className='text-xs text-gray-500 mt-0.5'>{category}</p>}
        </div>
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_STYLES[booking.status] || 'bg-gray-100'}`}>
          {booking.status}
        </span>
      </div>

      {/* Details */}
      <div className='text-sm text-gray-600 space-y-1 mb-3'>
        <p><span className='font-medium text-gray-700'>Role:</span> {role}</p>
        <p><span className='font-medium text-gray-700'>With:</span> {otherPerson?.name || 'Unknown user'}</p>
        <p><span className='font-medium text-gray-700'>Date:</span> {booking.preferredDate} at {booking.preferredTime}</p>
        <p><span className='font-medium text-gray-700'>Credits:</span> {booking.creditCost} SC</p>
        {booking.message && <p><span className='font-medium text-gray-700'>Note:</span> {booking.message}</p>}
      </div>

      {/* Action buttons based on status + role */}
      <div className='flex gap-2 flex-wrap'>
        {booking.status === 'pending' && isTeacher && (
          <>
            <button
              disabled={actionLoading}
              onClick={() => onStatusChange(booking._id, 'accepted')}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition shadow-sm'
            >
              ✓ Accept
            </button>
            <button
              disabled={actionLoading}
              onClick={() => onStatusChange(booking._id, 'rejected')}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition shadow-sm'
            >
              ✗ Reject
            </button>
          </>
        )}

        {booking.status === 'pending' && isStudent && (
          <button
            disabled={actionLoading}
            onClick={() => onStatusChange(booking._id, 'cancelled')}
            className='px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition shadow-sm'
          >
            Cancel booking
          </button>
        )}

        {booking.status === 'accepted' && (
          <>
            <button
              disabled={actionLoading}
              onClick={() => onStatusChange(booking._id, 'completed')}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition shadow-sm'
            >
              ✓ Mark completed
            </button>
            <button
              disabled={actionLoading}
              onClick={() => {
                const reason = window.prompt('Please enter a cancellation reason (optional):');
                if (reason !== null) onStatusChange(booking._id, 'cancelled', reason);
              }}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition shadow-sm'
            >
              Cancel session
            </button>
            <button
              disabled={actionLoading}
              onClick={() => {
                if (window.confirm('Report this session as a No-Show? This will resolve credits appropriately.')) {
                  onStatusChange(booking._id, 'no-show');
                }
              }}
              className='px-3 py-2 text-xs font-medium rounded-xl border border-amber-500 text-amber-700 hover:bg-amber-50 disabled:opacity-50 transition'
              title="Report partner did not attend"
            >
              ⚠️ Report No-Show
            </button>
          </>
        )}

        {(booking.status === 'rejected' || booking.status === 'cancelled' || booking.status === 'no-show') && (
          <div className='flex flex-col text-xs text-gray-500 py-1'>
            {booking.cancellationReason && (
              <span className='italic text-red-600'>Reason: {booking.cancellationReason}</span>
            )}
            {booking.penaltyAmount > 0 && (
              <span className='text-amber-700 font-medium'>Late penalty applied: {booking.penaltyAmount} SC</span>
            )}
          </div>
        )}

        {booking.status === 'completed' && (
          <ReviewButton bookingId={booking._id} />
        )}

        {otherPerson && (
          <Link
            to={`/messages/${otherPerson._id || otherPerson}`}
            className='px-4 py-2 text-sm font-medium rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5'
          >
            💬 Chat
          </Link>
        )}

        {booking.status === 'accepted' && (
          <Link
            to={`/session/${booking._id}`}
            className='px-4 py-2 text-sm font-medium rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition flex items-center gap-1.5'
          >
            📹 Video Call
          </Link>
        )}
      </div>
    </div>
  );
};

// ── Main Dashboard Page ────────────────────────────────────────────────
const DashboardPage = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [myListings, setMyListings] = useState([]);
  const [credits, setCredits] = useState({ creditBalance: 0, heldCredits: 0, availableBalance: 0 });
  const [bookings, setBookings] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationBasis, setRecommendationBasis] = useState('');
  const [loading, setLoading] = useState(true);
  const [recLoading, setRecLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text }
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'teaching' | 'learning'

  // ── Load data ──────────────────────────────────────────────────────
  const loadData = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRecLoading(false);
      return;
    }
    try {
      const [listingsResponse, creditsResponse, bookingsResponse, recsResponse] = await Promise.allSettled([
        skillService.getMyListings(accessToken),
        creditService.getBalance(accessToken),
        bookingService.getBookings(accessToken),
        skillService.getRecommendedListings(accessToken),
      ]);

      if (listingsResponse.status === 'fulfilled') {
        setMyListings(listingsResponse.value.data?.listings || []);
      }
      if (creditsResponse.status === 'fulfilled') {
        setCredits(creditsResponse.value.data || { creditBalance: 0, heldCredits: 0, availableBalance: 0 });
      }
      if (bookingsResponse.status === 'fulfilled') {
        setBookings(bookingsResponse.value.data?.bookings || []);
      }
      if (recsResponse.status === 'fulfilled') {
        setRecommendations(recsResponse.value.data?.recommendations || []);
        setRecommendationBasis(recsResponse.value.data?.basedOn || '');
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRecLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [accessToken, isAuthenticated]);

  // ── Handle status change with loading state ────────────────────────
  const handleStatusChange = async (bookingId, newStatus, cancellationReason = '') => {
    setActionLoading(true);
    setStatusMsg(null);
    try {
      await bookingService.updateBookingStatus(
        bookingId,
        { status: newStatus, cancellationReason },
        accessToken
      );
      setStatusMsg({ type: 'success', text: `Session marked as ${newStatus} successfully!` });
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  // ── Handle listing toggle (activate / deactivate) ──────────────────
  const handleToggleListing = async (listingId) => {
    setActionLoading(true);
    try {
      await skillService.toggleListing(listingId, accessToken);
      setStatusMsg({ type: 'success', text: 'Listing status updated!' });
      await loadData();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update listing' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // ── Handle listing delete ──────────────────────────────────────────
  const handleDeleteListing = async (listingId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    setActionLoading(true);
    try {
      await skillService.deleteListing(listingId, accessToken);
      setStatusMsg({ type: 'success', text: 'Listing deleted successfully!' });
      await loadData();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Failed to delete listing' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setStatusMsg(null), 3000);
    }
  };

  // ── Filter bookings by tab ─────────────────────────────────────────
  const userId = user?.id || user?._id;
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'teaching') {
      return (b.teacherId?._id === userId || b.teacherId === userId);
    }
    if (activeTab === 'learning') {
      return (b.studentId?._id === userId || b.studentId === userId);
    }
    return true;
  });

  // ── Counts for tab badges ─────────────────────────────────────────
  const teachCount = bookings.filter((b) => b.teacherId?._id === userId || b.teacherId === userId).length;
  const learnCount = bookings.filter((b) => b.studentId?._id === userId || b.studentId === userId).length;
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const streakCount = user?.streakCount || 0;

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>

        {/* ── Top stats cards ─────────────────────────────────────── */}
        <div className='grid gap-5 md:grid-cols-4 mb-8'>
          <div className='bg-white rounded-3xl p-6 shadow-sm border border-slate-100'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Welcome back</p>
            <h2 className='text-xl font-bold text-slate-800 mt-1 truncate'>{user?.name || 'Guest'}</h2>
            {streakCount > 0 ? (
              <span className='inline-flex items-center gap-1 text-xs font-bold text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full mt-2'>
                🔥 {streakCount}-Week Teaching Streak!
              </span>
            ) : (
              <span className='inline-flex items-center gap-1 text-[11px] text-slate-400 mt-2'>
                Teach a session this week to start a streak!
              </span>
            )}
          </div>

          <div className='bg-white rounded-3xl p-6 shadow-sm border border-slate-100'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Available credits</p>
            <h2 className='text-2xl font-bold text-emerald-700 mt-1'>{credits.creditBalance ?? user?.creditBalance ?? 0} SC</h2>
            <Link to='/credit-history' className='text-xs text-emerald-600 hover:underline mt-2 inline-block font-medium'>
              View credit ledger →
            </Link>
          </div>

          <div className='bg-white rounded-3xl p-6 shadow-sm border border-slate-100'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Held in Escrow</p>
            <h2 className='text-2xl font-bold text-amber-600 mt-1'>{credits.heldCredits ?? user?.heldCredits ?? 0} SC</h2>
            <p className='text-[11px] text-slate-400 mt-2'>Held for upcoming sessions</p>
          </div>

          <div className='bg-white rounded-3xl p-6 shadow-sm border border-slate-100'>
            <p className='text-xs font-medium text-slate-500 uppercase tracking-wider'>Pending Sessions</p>
            <h2 className='text-2xl font-bold text-blue-600 mt-1'>{pendingCount}</h2>
            <p className='text-[11px] text-slate-400 mt-2'>{bookings.length} total active sessions</p>
          </div>
        </div>

        {/* ── FR-13: Smart Matches / Recommendations Section ─────── */}
        <div className='bg-gradient-to-br from-emerald-900 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-md mb-8'>
          <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6'>
            <div>
              <div className='flex items-center gap-2'>
                <span className='bg-emerald-500/30 text-emerald-300 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider'>
                  🎯 Smart Matching Engine
                </span>
                {recommendationBasis && (
                  <span className='text-xs text-emerald-200/80'>
                    Based on: <strong className='text-white'>{recommendationBasis}</strong>
                  </span>
                )}
              </div>
              <h2 className='text-2xl font-bold mt-2'>Recommended Skill Providers For You</h2>
              <p className='text-slate-300 text-xs mt-1'>
                Personalized matches based on your learning interests and provider quality scores.
              </p>
            </div>
            <Link
              to='/profile/edit'
              className='text-xs font-medium bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl transition border border-white/20 whitespace-nowrap'
            >
              ⚙️ Customize Learning Goals
            </Link>
          </div>

          {recLoading ? (
            <p className='text-xs text-slate-400'>Analyzing compatibility & finding smart matches...</p>
          ) : recommendations.length > 0 ? (
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {recommendations.slice(0, 4).map((rec) => (
                <div
                  key={rec._id}
                  className='bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col justify-between hover:bg-white/15 transition'
                >
                  <div>
                    <div className='flex items-center justify-between gap-2 mb-2'>
                      <span className='text-[11px] font-extrabold bg-emerald-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-sm'>
                        ✨ {rec.matchScore}% Match
                      </span>
                      <span className='text-xs font-bold text-emerald-300'>{rec.creditCost} SC</span>
                    </div>
                    <h3 className='font-bold text-sm text-white line-clamp-1'>{rec.title}</h3>
                    <p className='text-[11px] text-slate-300 line-clamp-2 mt-1'>{rec.description}</p>
                    <div className='flex items-center gap-1.5 mt-3 text-xs text-slate-200'>
                      <div className='w-5 h-5 rounded-full bg-emerald-700 flex items-center justify-center text-[10px] font-bold'>
                        {rec.teacherId?.name?.[0] || 'T'}
                      </div>
                      <span className='truncate font-medium'>{rec.teacherId?.name}</span>
                      {rec.teacherId?.isVerified && <span className='text-blue-400 text-xs'>✓</span>}
                      {rec.teacherId?.streakCount > 0 && (
                        <span className='text-orange-400 text-[10px] font-bold'>🔥{rec.teacherId.streakCount}</span>
                      )}
                    </div>
                  </div>

                  <div className='pt-3 mt-3 border-t border-white/10 flex gap-2'>
                    <Link
                      to={`/listing/${rec._id}`}
                      className='flex-1 py-1.5 text-center text-xs font-semibold rounded-lg bg-white text-slate-900 hover:bg-slate-100 transition shadow-sm'
                    >
                      View Details
                    </Link>
                    <Link
                      to={`/book/${rec._id}`}
                      className='py-1.5 px-3 text-center text-xs font-semibold rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition'
                    >
                      Book
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-xs text-slate-400'>
              No listings match your learning profile yet. Explore all listings or update your profile!
            </p>
          )}
        </div>

        {/* ── Main content card ───────────────────────────────────── */}
        <div className='bg-white rounded-3xl p-8 shadow-sm mb-10 border border-slate-100'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-bold text-slate-800'>Session Management</h1>
              <p className='text-gray-500 text-sm'>Manage your scheduled sessions, teaching offers, and listings.</p>
            </div>
            <Link to='/create-listing' className='bg-emerald-600 text-white rounded-xl px-5 py-2.5 hover:bg-emerald-700 transition text-sm font-medium shadow-sm'>
              + Create Listing
            </Link>
          </div>

          {/* ── Status toast ──────────────────────────────────────── */}
          {statusMsg && (
            <div className={`mb-6 px-5 py-3 rounded-xl text-sm font-medium transition-all ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {statusMsg.text}
            </div>
          )}

          <div className='grid gap-8 lg:grid-cols-[1.1fr_1.9fr]'>

            {/* ── Left column: Listings ────────────────────────────── */}
            <div>
              <h2 className='text-xl font-semibold mb-4'>Your listings</h2>
              {loading ? (
                <p className='text-gray-600'>Loading your listings...</p>
              ) : myListings.length > 0 ? (
                <div className='grid gap-4'>
                  {myListings.map((listing) => (
                    <div key={listing._id} className='border rounded-2xl p-4 flex flex-col justify-between hover:shadow-sm transition bg-white gap-3'>
                      <div className='flex items-start justify-between'>
                        <div>
                          <h3 className='font-semibold text-gray-900'>{listing.title}</h3>
                          <p className='text-xs text-gray-500 mt-0.5'>{listing.category} • {listing.creditCost} SC</p>
                        </div>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${listing.isActive !== false ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                          {listing.isActive !== false ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className='flex items-center gap-2 pt-2 border-t text-xs'>
                        <Link to={`/listing/${listing._id}`} className='text-green-700 font-medium hover:underline'>View</Link>
                        <span className='text-gray-300'>|</span>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleToggleListing(listing._id)}
                          className='text-blue-600 font-medium hover:underline disabled:opacity-50'
                        >
                          {listing.isActive !== false ? 'Deactivate' : 'Activate'}
                        </button>
                        <span className='text-gray-300'>|</span>
                        <button
                          disabled={actionLoading}
                          onClick={() => handleDeleteListing(listing._id, listing.title)}
                          className='text-red-500 font-medium hover:underline disabled:opacity-50'
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className='text-gray-600'>You have not created any listings yet.</p>
              )}
            </div>

            {/* ── Right column: Sessions ───────────────────────────── */}
            <div>
              <h2 className='text-xl font-semibold mb-4'>Your sessions</h2>

              {/* Tab bar */}
              <div className='flex gap-2 mb-5 border-b pb-3'>
                {[
                  { key: 'all', label: 'All', count: bookings.length },
                  { key: 'teaching', label: 'Teaching', count: teachCount },
                  { key: 'learning', label: 'Learning', count: learnCount },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                      activeTab === tab.key
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>

              {/* Booking cards */}
              {loading ? (
                <p className='text-gray-600'>Loading sessions...</p>
              ) : filteredBookings.length > 0 ? (
                <div className='space-y-4'>
                  {filteredBookings.map((booking) => (
                    <BookingCard
                      key={booking._id}
                      booking={booking}
                      userId={userId}
                      onStatusChange={handleStatusChange}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              ) : (
                <p className='text-gray-500'>No sessions to show for this filter.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
