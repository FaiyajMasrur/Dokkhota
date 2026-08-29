import { useState } from 'react';
import disputeService from '../services/disputeService';
import { useAuth } from '../context/AuthContext';

const ReportModal = ({ isOpen, onClose, targetType = 'listing', targetId, reportedUserId, title = 'Report Content' }) => {
  const { isAuthenticated } = useAuth();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setError('Please sign in to submit a report.');
      return;
    }
    if (!reason.trim()) {
      setError('Please describe the issue or policy violation.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await disputeService.createDispute({
        targetType,
        targetId,
        reportedUserId,
        reason: reason.trim(),
      });
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setReason('');
        onClose();
      }, 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4'>
      <div className='bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-gray-100 animate-in fade-in zoom-in duration-150'>
        <div className='flex items-center justify-between mb-4'>
          <h3 className='text-xl font-bold text-gray-900 flex items-center gap-2'>
            <span>🚩</span> {title}
          </h3>
          <button
            onClick={onClose}
            className='text-gray-400 hover:text-gray-600 p-1 rounded-full text-lg'
          >
            ✕
          </button>
        </div>

        {success ? (
          <div className='py-8 text-center'>
            <div className='w-12 h-12 bg-green-100 text-green-700 rounded-full flex items-center justify-center mx-auto text-xl font-bold mb-3'>
              ✓
            </div>
            <h4 className='font-bold text-gray-900 text-lg'>Report Submitted</h4>
            <p className='text-sm text-gray-500 mt-1'>
              Thank you for keeping our community safe. Our moderation team will review this report.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className='space-y-4'>
            <p className='text-xs text-gray-500'>
              Tell us why you are reporting this {targetType}. Violations of Dokkhota guidelines include spam, inappropriate content, harassment, or no-show misbehavior.
            </p>

            {error && (
              <div className='p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200'>
                {error}
              </div>
            )}

            <div>
              <label className='block text-xs font-semibold text-gray-700 mb-1.5'>
                Reason / Details <span className='text-red-500'>*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Please describe what happened or what policy is being violated...'
                rows={4}
                required
                className='w-full border border-gray-200 rounded-2xl p-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-gray-50'
              />
            </div>

            <div className='flex gap-3 pt-2'>
              <button
                type='button'
                onClick={onClose}
                className='flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition'
              >
                Cancel
              </button>
              <button
                type='submit'
                disabled={loading}
                className='flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition shadow-sm'
              >
                {loading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ReportModal;
