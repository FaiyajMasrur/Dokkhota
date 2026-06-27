// Login page for Dokkhota
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService.js';
import { useAuth } from '../context/AuthContext.jsx';

const LoginPage = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      const response = await authService.login(email, password);
      const { accessToken, user } = response.data;
      auth.login(user, accessToken);
      navigate('/dashboard');
    } catch (err) {
      if (err.response?.data?.requiresVerification) {
        navigate('/verify-email', { state: { email, otp: err.response?.data?.otp } });
        return;
      }
      setError(err.response?.data?.message || 'Login failed');
    }
  };

  return (
    <div className='max-w-md mx-auto p-6'>
      <h1 className='text-2xl font-semibold mb-4'>Login</h1>
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
        <div>
          <label className='block mb-1'>Password</label>
          <input
            className='w-full border rounded p-2'
            type='password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button className='w-full bg-blue-600 text-white p-2 rounded' type='submit'>
          Log In
        </button>
      </form>
    </div>
  );
};

export default LoginPage;
