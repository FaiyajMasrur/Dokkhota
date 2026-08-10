// Admin dispute resolution page for Dokkhota
import { useEffect, useState } from "react";
import adminService from "../services/adminService.js";

const AdminFlagsPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDisputes = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminService.getDisputes();
      setDisputes(data.disputes || []);
    } catch (err) {
      console.error("Admin load disputes error:", err);
      setError("Failed to load reported disputes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const resolveDispute = async (id) => {
    try {
      await adminService.resolveDispute(id);
      loadDisputes();
    } catch (err) {
      console.error("Resolve dispute error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Dispute & Flag Resolution</h1>
              <p className="text-slate-500 text-sm mt-1">
                Review disputes and reports submitted by users regarding session misconduct or profile issues.
              </p>
            </div>

            <button
              onClick={loadDisputes}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl transition"
            >
              Refresh
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
                  <th className="p-4 border-b">Reporter</th>
                  <th className="p-4 border-b">Reported User</th>
                  <th className="p-4 border-b">Reason</th>
                  <th className="p-4 border-b">Date Reported</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      Loading disputes...
                    </td>
                  </tr>
                ) : disputes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      No reported disputes found.
                    </td>
                  </tr>
                ) : (
                  disputes.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-800">
                        {item.reporter?.name || "Anonymous User"}
                        <div className="text-xs text-slate-400">{item.reporter?.email}</div>
                      </td>

                      <td className="p-4 font-semibold text-rose-700">
                        {item.reportedUser?.name || "Reported User"}
                        <div className="text-xs text-slate-400">{item.reportedUser?.email}</div>
                      </td>

                      <td className="p-4 text-slate-700 max-w-xs">{item.reason}</td>

                      <td className="p-4 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleString()}
                      </td>

                      <td className="p-4">
                        {item.status === "Pending" ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                            Pending Review
                          </span>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                            Resolved ✓
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {item.status === "Pending" ? (
                          <button
                            onClick={() => resolveDispute(item._id)}
                            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                          >
                            Mark Resolved
                          </button>
                        ) : (
                          <span className="text-xs text-emerald-600 font-bold">Resolved</span>
                        )}
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

export default AdminFlagsPage;