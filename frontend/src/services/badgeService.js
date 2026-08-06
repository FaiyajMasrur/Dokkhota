// Axios service for Dokkhota badge requests
import { api } from './authService.js';

const badgeService = {
  async submitBadge(formData, token) {
    return api.post('/badges', formData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  async getMyBadges(token) {
    return api.get('/badges/my', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getUserBadges(userId) {
    return api.get(`/badges/user/${userId}`);
  },
  async getPendingBadges(token) {
    return api.get('/badges/pending', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getAllBadges(token) {
    return api.get('/badges/all', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async reviewBadge(badgeId, data, token) {
    return api.patch(`/badges/${badgeId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default badgeService;
