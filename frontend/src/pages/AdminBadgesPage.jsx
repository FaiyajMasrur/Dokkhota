// Admin badge approval page for Dokkhota — Feature 10: Skill verification badge
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import badgeService from '../services/badgeService.js';
import { Link } from 'react-router-dom';

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-700',
};

const AdminBadgesPage = () => {
  const { accessToken } = useAuth();
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [actionLoading, setActionLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const loadBadges = async () => {
    try {
      const res = await badgeService.getAllBadges(accessToken);
      setBadges(res.data.badges || []);
    } catch (err) {
      console.error('Failed to load badges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, [accessToken]);

  const handleReview = async (badgeId, status) => {
    const adminNote = status === 'rejected'
      ? prompt('Reason for rejection (optional):') || ''
      : '';

    setActionLoading(true);
    try {
      await badgeService.reviewBadge(badgeId, { status, adminNote }, accessToken);
      setStatusMsg({ type: 'success', text: `Badge ${status} successfully!` });
      await loadBadges();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.response?.data?.message || 'Action failed' });
    } finally {
      setActionLoading(false);
      setTimeout(() => setStatusMsg(null), 4000);
    }
  };

  const filtered = badges.filter((b) => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-semibold'>Skill Verification Badges</h1>
              <p className='text-gray-600 mt-1'>Review and approve user skill verification requests.</p>
            </div>
            <Link to='/admin' className='text-sm text-green-700 font-medium hover:underline'>
              ← Admin Panel
            </Link>
          </div>

          {statusMsg && (
            <div className={`mb-6 px-5 py-3 rounded-xl text-sm font-medium ${statusMsg.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
              {statusMsg.text}
            </div>
          )}

          {/* Filter tabs */}
          <div className='flex gap-2 mb-6'>
            {['pending', 'approved', 'rejected', 'all'].map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition ${
                  filter === tab ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {tab !== 'all' && ` (${badges.filter((b) => b.status === tab).length})`}
                {tab === 'all' && ` (${badges.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <p className='text-gray-500 py-6'>Loading badge requests...</p>
          ) : filtered.length > 0 ? (
            <div className='space-y-4'>
              {filtered.map((badge) => (
                <div key={badge._id} className='border rounded-2xl p-5 hover:shadow-sm transition'>
                  <div className='flex items-start justify-between mb-3'>
                    <div className='flex items-center gap-3'>
                      {/* User avatar */}
                      <div className='w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-sm overflow-hidden border'>
                        {badge.userId?.avatarUrl ? (
                          <img src={badge.userId.avatarUrl} alt='' className='w-full h-full object-cover' />
                        ) : (
                          badge.userId?.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>
                      <div>
                        <h3 className='font-semibold text-gray-900'>{badge.userId?.name || 'Unknown'}</h3>
                        <p className='text-xs text-gray-500'>{badge.userId?.email || ''}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-3 py-1 rounded-full ${STATUS_STYLES[badge.status] || 'bg-gray-100'}`}>
                      {badge.status}
                    </span>
                  </div>

                  <div className='text-sm text-gray-600 space-y-1 mb-3'>
                    <p><span className='font-medium text-gray-700'>Skill:</span> {badge.skillName}</p>
                    <p><span className='font-medium text-gray-700'>Proof type:</span> {badge.proofType}</p>
                    {badge.description && <p><span className='font-medium text-gray-700'>Description:</span> {badge.description}</p>}
                    {badge.proofUrl && (
                      <p>
                        <span className='font-medium text-gray-700'>Proof:</span>{' '}
                        <a href={`http://localhost:5000${badge.proofUrl}`} target='_blank' rel='noreferrer' className='text-blue-600 underline'>
                          View uploaded proof →
                        </a>
                      </p>
                    )}
                    {badge.adminNote && <p><span className='font-medium text-gray-700'>Admin note:</span> {badge.adminNote}</p>}
                    <p className='text-xs text-gray-400'>Submitted: {new Date(badge.createdAt).toLocaleDateString()}</p>
                  </div>

                  {badge.status === 'pending' && (
                    <div className='flex gap-2'>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleReview(badge._id, 'approved')}
                        className='px-4 py-2 text-sm font-medium rounded-xl bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition'
                      >
                        ✓ Approve
                      </button>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleReview(badge._id, 'rejected')}
                        className='px-4 py-2 text-sm font-medium rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition'
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='text-center py-12 text-gray-400 border rounded-2xl bg-slate-50'>
              <p className='font-medium'>No badge requests matching this filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminBadgesPage;
