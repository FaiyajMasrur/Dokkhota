// Reset password page for Dokkhota
import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import authService from '../services/authService.js';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setMessage('');
      return;
    }
    try {
      await authService.resetPassword(token, password);
      setMessage('Password reset successful! Please log in.');
      setError('');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed');
      setMessage('');
    }
  };

  return (
    <div className='max-w-md mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Reset Password</h1>
      {message && <div className='text-green-600 mb-4'>{message}</div>}
      {error && <div className='text-red-600 mb-4'>{error}</div>}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block mb-1'>New Password</label>
          <input
            className='w-full border rounded p-2'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className='block mb-1'>Confirm Password</label>
          <input
            className='w-full border rounded p-2'
            type='password'
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <button className='w-full bg-blue-600 text-white p-2 rounded' type='submit'>
          Reset Password
        </button>
      </form>
    </div>
  );
};

export default ResetPasswordPage;
