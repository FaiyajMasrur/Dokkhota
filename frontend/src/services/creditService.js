// Axios service for Dokkhota credit requests
import { api } from './authService.js';

const creditService = {
  async getBalance(token) {
    return api.get('/credits/balance', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getTransactions(token) {
    return api.get('/credits/transactions', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default creditService;
