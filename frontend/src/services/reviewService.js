// Axios service for Dokkhota review requests
import { api } from './authService.js';

const reviewService = {
  async createReview(data, token) {
    return api.post('/reviews', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getListingReviews(listingId) {
    return api.get(`/reviews/listing/${listingId}`);
  },
  async getUserReviews(userId) {
    return api.get(`/reviews/user/${userId}`);
  },
  async checkReview(bookingId, token) {
    return api.get(`/reviews/check/${bookingId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default reviewService;
