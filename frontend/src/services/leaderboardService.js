import { api } from "./authService.js";

const leaderboardService = {
  async getLeaderboard(sortBy = "rating", category = "") {
    const res = await api.get("/leaderboard", {
      params: { sortBy, category },
    });
    return res.data;
  },
};

export default leaderboardService;
