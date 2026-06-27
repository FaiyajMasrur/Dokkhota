// Axios service for Dokkhota user profile requests
import { api } from './authService.js';

const userService = {
  async getProfile(userId) {
    return api.get(`/users/${userId}/profile`);
  },
  async updateProfile(data, token) {
    return api.patch('/users/profile', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async updateSkillsOffered(skillsOffered, token) {
    return api.patch('/users/skills-offered', { skillsOffered }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default userService;
