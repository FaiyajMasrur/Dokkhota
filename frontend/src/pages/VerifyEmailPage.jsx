// Verify email page for Dokkhota OTP confirmation
import { useEffect, useMemo, useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import authService from '../services/authService.js';

const VerifyEmailPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || '';
  const otpFromRegistration = location.state?.otp || '';
  const [otp, setOtp] = useState(otpFromRegistration || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expiresAt, setExpiresAt] = useState(Date.now() + 15 * 60 * 1000);

  const timer = useMemo(() => {
    const diff = expiresAt - Date.now();
    if (diff <= 0) return '00:00';
    const minutes = String(Math.floor(diff / 60000)).padStart(2, '0');
    const seconds = String(Math.floor((diff % 60000) / 1000)).padStart(2, '0');
    return `${minutes}:${seconds}`;
  }, [expiresAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (expiresAt - Date.now() <= 0) {
        clearInterval(interval);
      }
      setExpiresAt((prev) => prev);
    }, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email) {
      setError('Email is required to verify OTP');
      return;
    }
    try {
      await authService.verifyEmail(email, otp);
      setSuccess('Email verified! You can now log in.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
    }
  };

  return (
    <div className='max-w-md mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Verify Email</h1>
      <p className='mb-3'>Enter the 6-digit code sent to <strong>{email}</strong>.</p>
      {otpFromRegistration && (
        <div className='mb-3 rounded border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800'>
          Development mode: your OTP is <strong>{otpFromRegistration}</strong>.
        </div>
      )}
      <div className='mb-2'>Expires in: {timer}</div>
      {success && <div className='text-green-600 mb-4'>{success}</div>}
      {error && <div className='text-red-600 mb-4'>{error}</div>}
      {!success ? (
        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label className='block mb-1'>OTP Code</label>
            <input
              className='w-full border rounded p-2'
              type='text'
              value={otp}
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ''))}
              required
            />
          </div>
          <button className='w-full bg-blue-600 text-white p-2 rounded' type='submit'>
            Verify Email
          </button>
        </form>
      ) : (
        <div className='space-y-3'>
          <Link className='inline-block text-blue-600 hover:underline' to='/login'>
            Go to login
          </Link>
          <button className='w-full bg-gray-200 p-2 rounded' onClick={() => navigate('/login')}>
            Login Now
          </button>
        </div>
      )}
    </div>
  );
};

export default VerifyEmailPage;
