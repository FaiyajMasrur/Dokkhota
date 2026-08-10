import { api } from "./authService.js";

const sessionHistoryService = {
  async getSessionHistory() {
    const res = await api.get("/session-history");
    return res.data;
  },
};

export default sessionHistoryService;
