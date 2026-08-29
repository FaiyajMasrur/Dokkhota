// Axios service for Dokkhota messaging requests
import { api } from './authService.js';

const messageService = {
  async getConversations(token) {
    return api.get('/messages/conversations', {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async getMessages(partnerId, token) {
    return api.get(`/messages/${partnerId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async sendMessage(data, token) {
    return api.post('/messages', data, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
  async addReaction(messageId, emoji, token) {
    return api.post(`/messages/${messageId}/react`, { emoji }, {
      headers: { Authorization: `Bearer ${token}` },
    });
  },
};

export default messageService;
