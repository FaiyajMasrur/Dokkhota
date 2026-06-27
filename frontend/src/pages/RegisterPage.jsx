// Registration page for Dokkhota with OTP verification flow
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService.js';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const response = await authService.register({ name, email, password });
      navigate('/verify-email', { state: { email, otp: response.data?.otp } });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className='max-w-md mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Register</h1>
      {error && <div className='text-red-600 mb-4'>{error}</div>}
      {success && <div className='text-green-600 mb-4'>{success}</div>}
      <form onSubmit={handleSubmit} className='space-y-4'>
        <div>
          <label className='block mb-1'>Full Name</label>
          <input
            className='w-full border rounded p-2'
            type='text'
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
        <div>
          <label className='block mb-1'>Password</label>
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
        <button className='w-full bg-green-600 text-white p-2 rounded' type='submit'>
          Register
        </button>
      </form>
    </div>
  );
};

export default RegisterPage;
