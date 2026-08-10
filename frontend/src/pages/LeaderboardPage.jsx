import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import leaderboardService from "../services/leaderboardService.js";

const LeaderboardPage = () => {
  const [users, setUsers] = useState([]);
  const [sortBy, setSortBy] = useState("rating"); // 'rating' | 'sessions' | 'credits'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await leaderboardService.getLeaderboard(sortBy);
      if (data.users) {
        setUsers(data.users);
      }
    } catch (err) {
      console.error("Leaderboard fetch error:", err);
      setError("Failed to load leaderboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, [sortBy]);

  const topThree = users.slice(0, 3);
  const remainingUsers = users.slice(3);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Skill Provider Leaderboard</h1>
              <p className="text-slate-500 text-sm mt-1">
                Top rated mentors, active skill exchange providers, and community contributors.
              </p>
            </div>

            {/* Sorting controls */}
            <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-2xl">
              <button
                onClick={() => setSortBy("rating")}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                  sortBy === "rating"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top Rated ★
              </button>
              <button
                onClick={() => setSortBy("sessions")}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                  sortBy === "sessions"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Most Sessions 🎓
              </button>
              <button
                onClick={() => setSortBy("credits")}
                className={`text-xs font-semibold px-3 py-2 rounded-xl transition ${
                  sortBy === "credits"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Top Credits 💰
              </button>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Top 3 Podiums */}
          {!loading && topThree.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
              {/* 2nd Place */}
              {topThree[1] && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center relative order-2 md:order-1 mt-4 md:mt-6">
                  <span className="absolute -top-3 bg-slate-300 text-slate-800 text-xs font-bold px-3 py-0.5 rounded-full shadow-sm">
                    2nd Place 🥈
                  </span>
                  <div className="w-16 h-16 rounded-full bg-slate-200 text-slate-700 font-bold text-xl flex items-center justify-center mb-3 mt-2 overflow-hidden">
                    {topThree[1].avatarUrl ? (
                      <img src={topThree[1].avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      topThree[1].name?.[0]
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-1">
                    {topThree[1].name}
                    {topThree[1].isVerified && (
                      <span className="text-blue-500" title="Verified Badge">✓</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{topThree[1].city || "Skill Provider"}</p>
                  <div className="flex items-center gap-3 text-xs font-semibold mt-3 text-slate-700">
                    <span>★ {topThree[1].averageRating}</span>
                    <span>• {topThree[1].completedSessions} Sessions</span>
                    <span>• {topThree[1].creditBalance} SC</span>
                  </div>
                </div>
              )}

              {/* 1st Place */}
              {topThree[0] && (
                <div className="bg-gradient-to-b from-amber-50 to-amber-100/50 border border-amber-300/70 rounded-2xl p-6 flex flex-col items-center text-center relative order-1 md:order-2 shadow-md">
                  <span className="absolute -top-3 bg-amber-400 text-amber-950 text-xs font-extrabold px-4 py-0.5 rounded-full shadow-sm">
                    1st Place 🏆
                  </span>
                  <div className="w-20 h-20 rounded-full bg-amber-200 text-amber-900 font-bold text-2xl flex items-center justify-center mb-3 mt-2 overflow-hidden ring-4 ring-amber-300">
                    {topThree[0].avatarUrl ? (
                      <img src={topThree[0].avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      topThree[0].name?.[0]
                    )}
                  </div>
                  <h3 className="font-extrabold text-slate-900 text-lg flex items-center gap-1">
                    {topThree[0].name}
                    {topThree[0].isVerified && (
                      <span className="text-blue-600" title="Verified Badge">✓</span>
                    )}
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">{topThree[0].city || "Top Mentor"}</p>
                  <div className="flex items-center gap-3 text-xs font-bold mt-4 text-amber-900 bg-amber-200/60 px-3 py-1.5 rounded-full">
                    <span>★ {topThree[0].averageRating} ({topThree[0].totalReviews})</span>
                    <span>• {topThree[0].completedSessions} Sessions</span>
                    <span>• {topThree[0].creditBalance} SC</span>
                  </div>
                </div>
              )}

              {/* 3rd Place */}
              {topThree[2] && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col items-center text-center relative order-3 mt-4 md:mt-8">
                  <span className="absolute -top-3 bg-amber-700 text-white text-xs font-bold px-3 py-0.5 rounded-full shadow-sm">
                    3rd Place 🥉
                  </span>
                  <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-800 font-bold text-xl flex items-center justify-center mb-3 mt-2 overflow-hidden">
                    {topThree[2].avatarUrl ? (
                      <img src={topThree[2].avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      topThree[2].name?.[0]
                    )}
                  </div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-1">
                    {topThree[2].name}
                    {topThree[2].isVerified && (
                      <span className="text-blue-500" title="Verified Badge">✓</span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{topThree[2].city || "Skill Provider"}</p>
                  <div className="flex items-center gap-3 text-xs font-semibold mt-3 text-slate-700">
                    <span>★ {topThree[2].averageRating}</span>
                    <span>• {topThree[2].completedSessions} Sessions</span>
                    <span>• {topThree[2].creditBalance} SC</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Complete Rankings Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b">Rank</th>
                  <th className="p-4 border-b">Provider</th>
                  <th className="p-4 border-b">Rating</th>
                  <th className="p-4 border-b">Sessions</th>
                  <th className="p-4 border-b">Credits</th>
                  <th className="p-4 border-b">Verified</th>
                  <th className="p-4 border-b">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      Loading leaderboard rankings...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      No skill providers found on the leaderboard yet.
                    </td>
                  </tr>
                ) : (
                  users.map((user, index) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-bold text-slate-700">
                        {index === 0 ? "🥇 #1" : index === 1 ? "🥈 #2" : index === 2 ? "🥉 #3" : `#${index + 1}`}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center overflow-hidden">
                            {user.avatarUrl ? (
                              <img src={user.avatarUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              user.name?.[0]
                            )}
                          </div>
                          <div>
                            <div className="font-bold text-slate-800 flex items-center gap-1">
                              {user.name}
                              {user.isVerified && (
                                <span className="text-blue-600 text-xs font-bold" title="Verified Badge">✓</span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400">{user.city || "Provider"}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-semibold text-amber-600">
                        ★ {user.averageRating || 5.0} <span className="text-xs text-slate-400">({user.totalReviews || 0})</span>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{user.completedSessions || 0}</td>
                      <td className="p-4 font-bold text-emerald-600">{user.creditBalance} SC</td>
                      <td className="p-4">
                        {user.isVerified ? (
                          <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                            Verified ✓
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-500 text-xs px-2.5 py-1 rounded-full">
                            Standard
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <Link
                          to={`/profile/${user._id}`}
                          className="text-xs bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;