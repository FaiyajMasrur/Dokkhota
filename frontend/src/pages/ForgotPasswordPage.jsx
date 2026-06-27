// Forgot password page for Dokkhota
import { useState } from 'react';
import authService from '../services/authService.js';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await authService.forgotPassword(email);
      setMessage('Reset email sent if account exists. Check your inbox.');
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to send reset email');
      setMessage('');
    }
  };

  return (
    <div className='max-w-md mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Forgot Password</h1>
      {message && <div className='text-green-600 mb-4'>{message}</div>}
      {error && <div className='text-red-600 mb-4'>{error}</div>}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block mb-1'>Email</label>
          <input
            className='w-full border rounded p-2'
            type='email'
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <button className='w-full bg-blue-600 text-white p-2 rounded' type='submit'>
          Send Reset Email
        </button>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;
