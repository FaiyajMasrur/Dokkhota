// Axios service for Dokkhota request board requests
import { api } from './authService.js';

const requestService = {
  async createRequest(data, token) {
    return api.post('/requests', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getRequests(token) {
    return api.get('/requests', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getMyRequests(token) {
    return api.get('/requests/mine', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async respondToRequest(requestId, message, token) {
    return api.post(`/requests/${requestId}/respond`, { message }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async updateResponseStatus(requestId, responseId, status, token) {
    return api.patch(`/requests/${requestId}/respond`, { responseId, status }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default requestService;
