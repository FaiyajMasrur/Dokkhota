// Axios service for Dokkhota auth requests and token refresh handling
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,
});

const authService = {
  async register(data) {
    return api.post('/auth/register', data);
  },
  async verifyEmail(email, otp) {
    return api.post('/auth/verify-email', { email, otp });
  },
  async login(email, password) {
    return api.post('/auth/login', { email, password });
  },
  async refreshToken() {
    return api.post('/auth/refresh');
  },
  async logout() {
    return api.post('/auth/logout');
  },
  async getMe() {
    return api.get('/auth/me');
  },
  async forgotPassword(email) {
    return api.post('/auth/forgot-password', { email });
  },
  async resetPassword(token, password) {
    return api.post(`/auth/reset-password/${token}`, { password });
  },
};

export { api };
export default authService;
