// Axios service for Dokkhota category requests
import { api } from './authService.js';

const categoryService = {
  async getCategories() {
    return api.get('/categories');
  },
  async getAllCategories(token) {
    return api.get('/categories?all=true', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async createCategory(data, token) {
    return api.post('/categories', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async updateCategory(categoryId, data, token) {
    return api.patch(`/categories/${categoryId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async deleteCategory(categoryId, token) {
    return api.delete(`/categories/${categoryId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default categoryService;
