import { api } from "./authService.js";

const disputeService = {
  async createDispute(payload, legacyReason) {
    // Support both createDispute({ targetType, targetId, reason }) and createDispute(reportedUserId, reason)
    const body =
      typeof payload === 'object' && payload !== null
        ? payload
        : { reportedUserId: payload, reason: legacyReason };
    const res = await api.post("/disputes", body);
    return res.data;
  },
};

export default disputeService;
