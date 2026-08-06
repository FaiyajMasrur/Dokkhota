// Public profile page for Dokkhota — Features 9 & 10: Reviews display + Badge submission & display
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import userService from '../services/userService.js';
import reviewService from '../services/reviewService.js';
import badgeService from '../services/badgeService.js';

const ProfilePage = () => {
  const { userId } = useParams();
  const { user: currentUser, accessToken, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);

  // Badges (public approved badges)
  const [badges, setBadges] = useState([]);

  // Badge submission form (only for own profile)
  const [showBadgeForm, setShowBadgeForm] = useState(false);
  const [myBadges, setMyBadges] = useState([]);
  const [badgeForm, setBadgeForm] = useState({ skillName: '', description: '', proofType: 'certificate' });
  const [badgeFile, setBadgeFile] = useState(null);
  const [badgeSubmitting, setBadgeSubmitting] = useState(false);
  const [badgeMsg, setBadgeMsg] = useState(null);

  const isOwnProfile = isAuthenticated && (currentUser?.id === userId || currentUser?._id === userId);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const response = await userService.getProfile(userId);
        setProfile(response.data.user);
      } catch (error) {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  // Load reviews for this user
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const res = await reviewService.getUserReviews(userId);
        setReviews(res.data.reviews || []);
        setAvgRating(res.data.averageRating || 0);
      } catch (e) { /* ignore */ }
    };
    loadReviews();
  }, [userId]);

  // Load approved badges for this user (public)
  useEffect(() => {
    const loadBadges = async () => {
      try {
        const res = await badgeService.getUserBadges(userId);
        setBadges(res.data.badges || []);
      } catch (e) { /* ignore */ }
    };
    loadBadges();
  }, [userId]);

  // Load own badge requests if viewing own profile
  useEffect(() => {
    if (!isOwnProfile || !accessToken) return;
    const loadMyBadges = async () => {
      try {
        const res = await badgeService.getMyBadges(accessToken);
        setMyBadges(res.data.badges || []);
      } catch (e) { /* ignore */ }
    };
    loadMyBadges();
  }, [isOwnProfile, accessToken]);

  const handleBadgeSubmit = async (e) => {
    e.preventDefault();
    if (!badgeForm.skillName.trim()) return;

    setBadgeSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('skillName', badgeForm.skillName);
      formData.append('description', badgeForm.description);
      formData.append('proofType', badgeForm.proofType);
      if (badgeFile) formData.append('proof', badgeFile);

      await badgeService.submitBadge(formData, accessToken);
      setBadgeMsg({ type: 'success', text: 'Badge request submitted! An admin will review it.' });
      setBadgeForm({ skillName: '', description: '', proofType: 'certificate' });
      setBadgeFile(null);
      setShowBadgeForm(false);

      // Refresh own badges
      const res = await badgeService.getMyBadges(accessToken);
      setMyBadges(res.data.badges || []);
    } catch (err) {
      setBadgeMsg({ type: 'error', text: err.response?.data?.message || 'Submission failed' });
    } finally {
      setBadgeSubmitting(false);
      setTimeout(() => setBadgeMsg(null), 4000);
    }
  };

  const renderStars = (rating) => {
    return '⭐'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
  };

  if (loading) {
    return <div className='max-w-6xl mx-auto px-4 py-10'>Loading profile...</div>;
  }

  if (!profile) {
    return <div className='max-w-6xl mx-auto px-4 py-10'>Profile not found.</div>;
  }

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='bg-white p-8 rounded-3xl shadow-sm'>
          <div className='flex items-center justify-between gap-4 mb-6'>
            <div className='flex items-center gap-3'>
              <h1 className='text-3xl font-semibold'>{profile.name}</h1>
              {profile.isVerified && (
                <span className='bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1'>
                  ✓ Verified
                </span>
              )}
            </div>
            {isOwnProfile && (
              <Link to='/profile/edit' className='bg-green-600 text-white rounded-full px-5 py-3 hover:bg-green-700'>Edit profile</Link>
            )}
          </div>
          <div className='flex flex-col md:flex-row gap-6'>
            <div className='w-full md:w-1/3'>
              <div className='bg-gray-100 rounded-3xl p-6 text-center'>
                <div className='text-4xl font-bold text-green-700 mb-4'>{profile.name?.charAt(0)}</div>
                <h2 className='text-2xl font-semibold'>{profile.name}</h2>
                <p className='text-gray-600'>{profile.city || 'Unknown city'}</p>
                {avgRating > 0 && (
                  <div className='mt-3'>
                    <span className='text-lg'>{renderStars(avgRating)}</span>
                    <p className='text-sm text-gray-500 mt-1'>{avgRating}/5 ({reviews.length} reviews)</p>
                  </div>
                )}
              </div>
            </div>
            <div className='w-full md:w-2/3'>
              <h2 className='text-2xl font-semibold mb-3'>About</h2>
              <p className='text-gray-700 mb-4'>{profile.bio || 'No bio available yet.'}</p>
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='bg-slate-50 rounded-3xl p-5'>
                  <span className='block text-sm text-gray-500'>Credits</span>
                  <span className='text-xl font-semibold'>{profile.creditBalance}</span>
                </div>
                <div className='bg-slate-50 rounded-3xl p-5'>
                  <span className='block text-sm text-gray-500'>Languages</span>
                  <span className='text-lg'>{profile.languages?.join(', ') || 'None'}</span>
                </div>
                <div className='bg-slate-50 rounded-3xl p-5'>
                  <span className='block text-sm text-gray-500'>Skills offered</span>
                  <span className='text-lg'>{profile.skillsOffered?.length || 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Verified Badges ──────────────────────────────────────────── */}
        {(badges.length > 0 || isOwnProfile) && (
          <div className='mt-8 bg-white rounded-3xl p-8 shadow-sm'>
            <div className='flex items-center justify-between mb-4'>
              <h3 className='text-xl font-semibold'>Skill Verification Badges</h3>
              {isOwnProfile && (
                <button
                  onClick={() => setShowBadgeForm(!showBadgeForm)}
                  className='text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition'
                >
                  {showBadgeForm ? 'Cancel' : '+ Request Badge'}
                </button>
              )}
            </div>

            {badgeMsg && (
              <div className={`mb-4 px-4 py-2 rounded-xl text-sm font-medium ${badgeMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
                {badgeMsg.text}
              </div>
            )}

            {/* Badge submission form */}
            {showBadgeForm && isOwnProfile && (
              <form onSubmit={handleBadgeSubmit} className='border rounded-2xl p-5 mb-6 bg-slate-50 space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Skill Name *</label>
                  <input
                    type='text'
                    value={badgeForm.skillName}
                    onChange={(e) => setBadgeForm({ ...badgeForm, skillName: e.target.value })}
                    placeholder='e.g., JavaScript, Piano, Photography'
                    className='w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600'
                    required
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Proof Type</label>
                  <select
                    value={badgeForm.proofType}
                    onChange={(e) => setBadgeForm({ ...badgeForm, proofType: e.target.value })}
                    className='w-full border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600'
                  >
                    <option value='certificate'>Certificate</option>
                    <option value='portfolio'>Portfolio</option>
                    <option value='degree'>Degree</option>
                    <option value='experience'>Work Experience</option>
                    <option value='other'>Other</option>
                  </select>
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Description (optional)</label>
                  <textarea
                    value={badgeForm.description}
                    onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                    placeholder='Brief description of your expertise...'
                    className='w-full border rounded-xl px-4 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-600'
                  />
                </div>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Upload Proof (image or PDF, max 5MB)</label>
                  <input
                    type='file'
                    accept='.jpg,.jpeg,.png,.webp,.pdf'
                    onChange={(e) => setBadgeFile(e.target.files[0])}
                    className='text-sm'
                  />
                </div>
                <button
                  type='submit'
                  disabled={badgeSubmitting}
                  className='bg-blue-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition'
                >
                  {badgeSubmitting ? 'Submitting...' : 'Submit for Verification'}
                </button>
              </form>
            )}

            {/* Approved badges (public) */}
            {badges.length > 0 ? (
              <div className='flex flex-wrap gap-3'>
                {badges.map((badge) => (
                  <div key={badge._id} className='flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-2'>
                    <span className='text-blue-600 text-sm'>✓</span>
                    <span className='text-sm font-medium text-blue-800'>{badge.skillName}</span>
                    <span className='text-xs text-blue-500'>({badge.proofType})</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className='text-gray-500 text-sm'>No verified badges yet.</p>
            )}

            {/* Own badge request statuses (only for own profile) */}
            {isOwnProfile && myBadges.length > 0 && (
              <div className='mt-6'>
                <h4 className='text-sm font-semibold text-gray-700 mb-3'>Your Badge Requests</h4>
                <div className='space-y-2'>
                  {myBadges.map((badge) => (
                    <div key={badge._id} className='flex items-center justify-between border rounded-xl p-3 text-sm'>
                      <div>
                        <span className='font-medium'>{badge.skillName}</span>
                        <span className='text-gray-400 ml-2'>({badge.proofType})</span>
                      </div>
                      <span className={`text-xs font-medium px-3 py-1 rounded-full ${
                        badge.status === 'approved' ? 'bg-green-100 text-green-800' :
                        badge.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {badge.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Skills Offered ───────────────────────────────────────────── */}
        <div className='mt-8 bg-white rounded-3xl p-8 shadow-sm'>
          <h3 className='text-xl font-semibold mb-4'>Skills Offered</h3>
          {profile.skillsOffered?.length > 0 ? (
            <div className='grid gap-4'>
              {profile.skillsOffered.map((skill, index) => (
                <div key={index} className='border rounded-3xl p-5'>
                  <div className='flex items-center justify-between mb-2'>
                    <span className='font-semibold'>{skill.title}</span>
                    <span className='text-sm text-gray-500'>{skill.category}</span>
                  </div>
                  <p className='text-gray-600'>{skill.description}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className='text-gray-600'>No skills offered yet.</p>
          )}
        </div>

        {/* ── Reviews ──────────────────────────────────────────────────── */}
        {reviews.length > 0 && (
          <div className='mt-8 bg-white rounded-3xl p-8 shadow-sm'>
            <h3 className='text-xl font-semibold mb-4'>Reviews ({reviews.length})</h3>
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
                    <span className='text-sm'>{renderStars(review.rating)}</span>
                  </div>
                  {review.comment && <p className='text-sm text-gray-600'>{review.comment}</p>}
                  <div className='flex items-center gap-2 mt-2'>
                    {review.listingId?.title && (
                      <span className='text-xs text-gray-400'>Session: {review.listingId.title}</span>
                    )}
                    <span className='text-xs text-gray-400'>
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
