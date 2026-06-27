// Axios service for Dokkhota booking requests
import { api } from './authService.js';

const bookingService = {
  async createBooking(data, token) {
    return api.post('/bookings', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getBookings(token) {
    return api.get('/bookings', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async updateBookingStatus(bookingId, status, token) {
    return api.patch(`/bookings/${bookingId}`, { status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default bookingService;
