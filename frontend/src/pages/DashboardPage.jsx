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

// ── Confirmation modal ─────────────────────────────────────────────────
const ConfirmModal = ({ show, title, message, onConfirm, onCancel, confirmLabel, confirmColor }) => {
  if (!show) return null;
  return (
    <div className='fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50'>
      <div className='bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4'>
        <h3 className='text-lg font-semibold mb-2'>{title}</h3>
        <p className='text-gray-600 mb-6'>{message}</p>
        <div className='flex gap-3 justify-end'>
          <button onClick={onCancel} className='px-4 py-2 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 transition'>
            Go back
          </button>
          <button onClick={onConfirm} className={`px-4 py-2 rounded-xl text-white transition ${confirmColor || 'bg-green-600 hover:bg-green-700'}`}>
            {confirmLabel || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
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

  const [confirm, setConfirm] = useState(null); // { status, title, message, confirmLabel, confirmColor }

  const requestAction = (status, title, message, confirmLabel, confirmColor) => {
    setConfirm({ status, title, message, confirmLabel, confirmColor });
  };

  const handleConfirm = () => {
    onStatusChange(booking._id, confirm.status);
    setConfirm(null);
  };

  return (
    <div className='border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow'>
      <ConfirmModal
        show={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        confirmColor={confirm?.confirmColor}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

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
              onClick={() => requestAction('accepted', 'Accept this session?', `You are confirming the session "${listingTitle}" with ${otherPerson?.name}. The student's credits will remain on hold until the session is completed.`, 'Accept', 'bg-blue-600 hover:bg-blue-700')}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition'
            >
              ✓ Accept
            </button>
            <button
              disabled={actionLoading}
              onClick={() => requestAction('rejected', 'Reject this session?', `You are rejecting the session "${listingTitle}". The student's held credits (${booking.creditCost} SC) will be refunded to them automatically.`, 'Reject', 'bg-red-600 hover:bg-red-700')}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition'
            >
              ✗ Reject
            </button>
          </>
        )}

        {booking.status === 'pending' && isStudent && (
          <button
            disabled={actionLoading}
            onClick={() => requestAction('cancelled', 'Cancel this booking?', `You are cancelling your booking for "${listingTitle}". Your held credits (${booking.creditCost} SC) will be refunded to your available balance.`, 'Cancel booking', 'bg-red-600 hover:bg-red-700')}
            className='px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition'
          >
            Cancel booking
          </button>
        )}

        {booking.status === 'accepted' && (
          <>
            <button
              disabled={actionLoading}
              onClick={() => requestAction('completed', 'Mark session as completed?', `This will finalize the session. ${booking.creditCost} SC will be transferred from the student to the teacher. This action cannot be undone.`, 'Mark completed', 'bg-green-600 hover:bg-green-700')}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition'
            >
              ✓ Mark completed
            </button>
            <button
              disabled={actionLoading}
              onClick={() => requestAction('cancelled', 'Cancel this session?', `You are cancelling the accepted session "${listingTitle}". The student's held credits (${booking.creditCost} SC) will be refunded.`, 'Cancel session', 'bg-red-600 hover:bg-red-700')}
              className='px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition'
            >
              Cancel session
            </button>
          </>
        )}

        {(booking.status === 'rejected' || booking.status === 'cancelled') && (
          <span className='text-xs text-gray-400 italic py-2'>No actions available</span>
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
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text }
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'teaching' | 'learning'

  // ── Load data ──────────────────────────────────────────────────────
  const loadData = async () => {
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

  useEffect(() => {
    loadData();
  }, [accessToken, isAuthenticated]);

  // ── Handle status change with loading state ────────────────────────
  const handleStatusChange = async (bookingId, newStatus) => {
    setActionLoading(true);
    setStatusMsg(null);
    try {
      await bookingService.updateBookingStatus(bookingId, newStatus, accessToken);
      setStatusMsg({ type: 'success', text: `Session ${newStatus} successfully!` });
      // Refresh everything (bookings + credits) so the UI is always in sync
      await loadData();
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong. Please try again.';
      setStatusMsg({ type: 'error', text: msg });
    } finally {
      setActionLoading(false);
      // Clear status message after 4 seconds
      setTimeout(() => setStatusMsg(null), 4000);
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

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>

        {/* ── Top stats cards ─────────────────────────────────────── */}
        <div className='grid gap-6 md:grid-cols-4 mb-10'>
          <div className='bg-white rounded-3xl p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Welcome back</p>
            <h2 className='text-2xl font-semibold'>{user?.name || 'Guest'}</h2>
          </div>
          <div className='bg-white rounded-3xl p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Available credits</p>
            <h2 className='text-2xl font-semibold text-green-700'>{credits.creditBalance ?? user?.creditBalance ?? 0} SC</h2>
          </div>
          <div className='bg-white rounded-3xl p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Held credits</p>
            <h2 className='text-2xl font-semibold text-yellow-600'>{credits.heldCredits ?? user?.heldCredits ?? 0} SC</h2>
          </div>
          <div className='bg-white rounded-3xl p-6 shadow-sm'>
            <p className='text-sm text-gray-500'>Pending sessions</p>
            <h2 className='text-2xl font-semibold text-blue-600'>{pendingCount}</h2>
          </div>
        </div>

        {/* ── Main content card ───────────────────────────────────── */}
        <div className='bg-white rounded-3xl p-8 shadow-sm mb-10'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-semibold'>Dashboard</h1>
              <p className='text-gray-600'>Manage your profile, listings, and sessions.</p>
            </div>
            <Link to='/create-listing' className='bg-green-600 text-white rounded-full px-5 py-3 hover:bg-green-700 transition'>Create listing</Link>
          </div>

          {/* ── Status toast ──────────────────────────────────────── */}
          {statusMsg && (
            <div className={`mb-6 px-5 py-3 rounded-xl text-sm font-medium transition-all ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {statusMsg.text}
            </div>
          )}

          <div className='grid gap-8 lg:grid-cols-[1fr_2fr]'>

            {/* ── Left column: Listings ────────────────────────────── */}
            <div>
              <h2 className='text-xl font-semibold mb-4'>Your listings</h2>
              {loading ? (
                <p className='text-gray-600'>Loading your listings...</p>
              ) : myListings.length > 0 ? (
                <div className='grid gap-4'>
                  {myListings.map((listing) => (
                    <div key={listing._id} className='border rounded-2xl p-4 flex items-center justify-between hover:shadow-sm transition'>
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
