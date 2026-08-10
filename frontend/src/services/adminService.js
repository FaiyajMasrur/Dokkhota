import { api } from "./authService.js";

const adminService = {
  async getDashboard() {
    const res = await api.get("/admin/dashboard");
    return res.data;
  },
  async getUsers() {
    const res = await api.get("/admin/users");
    return res.data;
  },
  async suspendUser(id) {
    const res = await api.put(`/admin/users/${id}/suspend`);
    return res.data;
  },
  async unsuspendUser(id) {
    const res = await api.put(`/admin/users/${id}/unsuspend`);
    return res.data;
  },
  async deleteUser(id) {
    const res = await api.delete(`/admin/users/${id}`);
    return res.data;
  },
  async getDisputes() {
    const res = await api.get("/admin/disputes");
    return res.data;
  },
  async resolveDispute(id) {
    const res = await api.put(`/admin/disputes/${id}`);
    return res.data;
  },
};

export default adminService;
