// Axios service for Dokkhota category requests
import { api } from './authService.js';

const categoryService = {
  async getCategories() {
    return api.get('/categories');
  },
  async createCategory(data, token) {
    return api.post('/categories', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default categoryService;
