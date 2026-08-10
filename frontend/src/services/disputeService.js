import { api } from "./authService.js";

const disputeService = {
  async createDispute(reportedUserId, reason) {
    const res = await api.post("/disputes", { reportedUserId, reason });
    return res.data;
  },
};

export default disputeService;
