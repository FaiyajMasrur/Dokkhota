import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import sessionHistoryService from "../services/sessionHistoryService.js";

const SessionHistoryPage = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'teaching' | 'learning'

  const loadSessionHistory = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await sessionHistoryService.getSessionHistory();
      if (data.sessions) {
        setSessions(data.sessions);
      }
    } catch (err) {
      console.error("Session history fetch error:", err);
      setError("Failed to load session history log.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessionHistory();
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (activeTab === "teaching") return s.role === "Teacher";
    if (activeTab === "learning") return s.role === "Learner";
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">Completed</span>;
      case "accepted":
        return <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full">Confirmed</span>;
      case "pending":
        return <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">Pending</span>;
      case "cancelled":
        return <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-full">Cancelled</span>;
      case "rejected":
        return <span className="bg-gray-100 text-gray-800 text-xs font-semibold px-2.5 py-1 rounded-full">Declined</span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-xs font-semibold px-2.5 py-1 rounded-full">{status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Session History Log</h1>
              <p className="text-slate-500 text-sm mt-1">
                Complete log of teaching and learning sessions, partner details, date, status, and credits transacted.
              </p>
            </div>
            <button
              onClick={loadSessionHistory}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl transition"
            >
              Refresh Log
            </button>
          </div>

          {/* Role Filter Tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            <button
              onClick={() => setActiveTab("all")}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === "all"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              All Sessions ({sessions.length})
            </button>
            <button
              onClick={() => setActiveTab("teaching")}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === "teaching"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              As Teacher ({sessions.filter((s) => s.role === "Teacher").length})
            </button>
            <button
              onClick={() => setActiveTab("learning")}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                activeTab === "learning"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              As Learner ({sessions.filter((s) => s.role === "Learner").length})
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b">Role</th>
                  <th className="p-4 border-b">Skill Offered</th>
                  <th className="p-4 border-b">Partner</th>
                  <th className="p-4 border-b">Date & Time</th>
                  <th className="p-4 border-b">Credits</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      Loading session history...
                    </td>
                  </tr>
                ) : filteredSessions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      No session history records found.
                    </td>
                  </tr>
                ) : (
                  filteredSessions.map((session) => (
                    <tr key={session._id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-800">
                        <span className={`px-2.5 py-1 rounded-md text-xs ${session.role === 'Teacher' ? 'bg-indigo-100 text-indigo-800' : 'bg-teal-100 text-teal-800'}`}>
                          {session.role}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-slate-800">{session.skill}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {session.partner?.avatarUrl ? (
                            <img
                              src={session.partner.avatarUrl}
                              alt=""
                              className="w-7 h-7 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-xs">
                              {session.partner?.name?.[0] || "?"}
                            </div>
                          )}
                          <span className="font-medium">{session.partner?.name || "User"}</span>
                        </div>
                      </td>
                      <td className="p-4 text-xs text-slate-600">
                        <div>{session.sessionDate || "N/A"}</div>
                        {session.sessionTime && <div className="text-slate-400">{session.sessionTime}</div>}
                      </td>
                      <td className="p-4 font-bold text-slate-800">{session.creditCost || 0} SC</td>
                      <td className="p-4">{getStatusBadge(session.status)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {(session.status === "accepted" || session.status === "Completed") && (
                            <Link
                              to={`/session/${session.bookingId}`}
                              className="text-xs bg-emerald-600 text-white font-medium px-2.5 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                            >
                              Join Call
                            </Link>
                          )}
                          {session.partner?._id && (
                            <Link
                              to={`/messages/${session.partner._id}`}
                              className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1.5 rounded-lg hover:bg-slate-200 transition"
                            >
                              Chat
                            </Link>
                          )}
                        </div>
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

export default SessionHistoryPage;