// Axios service for Dokkhota skill listing requests
import { api } from './authService.js';

const skillService = {
  async searchListings(params) {
    return api.get('/skills/search', { params });
  },
  async getListing(listingId) {
    return api.get(`/skills/${listingId}`);
  },
  async createListing(data, token) {
    return api.post('/skills', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async updateListing(listingId, data, token) {
    return api.patch(`/skills/${listingId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async toggleListing(listingId, token) {
    return api.patch(`/skills/${listingId}/toggle`, null, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getMyListings(token) {
    return api.get('/skills/my', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default skillService;
