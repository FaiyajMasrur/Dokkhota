import { api } from "./authService.js";

const notificationService = {
  async getNotifications() {
    const res = await api.get("/notifications");
    return res.data;
  },
  async markAsRead(id) {
    const res = await api.put(`/notifications/${id}`);
    return res.data;
  },
  async markAllAsRead() {
    const res = await api.put("/notifications/read-all");
    return res.data;
  },
  async deleteNotification(id) {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },
};

export default notificationService;
