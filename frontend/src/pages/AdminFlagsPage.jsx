// Admin dispute resolution page for Dokkhota
import { useEffect, useState } from "react";
import adminService from "../services/adminService.js";

const AdminFlagsPage = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolutionAction, setResolutionAction] = useState("dismiss");
  const [resolutionNote, setResolutionNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

  const handleOpenResolve = (dispute) => {
    setSelectedDispute(dispute);
    setResolutionAction("dismiss");
    setResolutionNote("");
  };

  const handleSubmitResolve = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;

    setActionLoading(true);
    try {
      await adminService.resolveDispute(selectedDispute._id, {
        action: resolutionAction,
        resolutionNote: resolutionNote.trim(),
        status: resolutionAction === "dismiss" ? "Dismissed" : "Resolved",
      });
      setSelectedDispute(null);
      loadDisputes();
    } catch (err) {
      console.error("Resolve dispute error:", err);
      alert(err.response?.data?.message || "Failed to resolve dispute");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">Dispute & Content Moderation</h1>
              <p className="text-slate-500 text-sm mt-1">
                Review community flags on users, skill listings, and reviews with granular resolution actions.
              </p>
            </div>

            <button
              onClick={loadDisputes}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl transition shadow-sm"
            >
              Refresh Queue
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
                  <th className="p-4 border-b">Target Type</th>
                  <th className="p-4 border-b">Reporter</th>
                  <th className="p-4 border-b">Reported Party / Entity</th>
                  <th className="p-4 border-b">Reason</th>
                  <th className="p-4 border-b">Date Reported</th>
                  <th className="p-4 border-b">Status & Resolution</th>
                  <th className="p-4 border-b">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      Loading disputes...
                    </td>
                  </tr>
                ) : disputes.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-10 text-slate-400">
                      No reported disputes found.
                    </td>
                  </tr>
                ) : (
                  disputes.map((item) => (
                    <tr key={item._id} className="hover:bg-slate-50 transition">
                      <td className="p-4">
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full uppercase ${
                            item.targetType === "listing"
                              ? "bg-purple-100 text-purple-800"
                              : item.targetType === "review"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {item.targetType || "user"}
                        </span>
                      </td>

                      <td className="p-4 font-medium text-slate-800">
                        {item.reporter?.name || "Anonymous User"}
                        <div className="text-xs text-slate-400">{item.reporter?.email}</div>
                      </td>

                      <td className="p-4 font-medium text-rose-700">
                        {item.reportedUser?.name || "Reported Entity"}
                        <div className="text-xs text-slate-400">{item.reportedUser?.email}</div>
                      </td>

                      <td className="p-4 text-slate-700 max-w-xs">
                        <p className="font-normal text-xs leading-relaxed">{item.reason}</p>
                      </td>

                      <td className="p-4 text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()} {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>

                      <td className="p-4">
                        {item.status === "Pending" ? (
                          <span className="bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                            Pending Review
                          </span>
                        ) : (
                          <div>
                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                item.status === "Dismissed"
                                  ? "bg-slate-100 text-slate-600"
                                  : "bg-emerald-100 text-emerald-800"
                              }`}
                            >
                              {item.status} ({item.resolutionAction || "action taken"})
                            </span>
                            {item.resolutionNote && (
                              <p className="text-[11px] text-slate-500 mt-1 italic">
                                Note: {item.resolutionNote}
                              </p>
                            )}
                            {item.resolvedBy && (
                              <p className="text-[10px] text-slate-400">
                                By: {item.resolvedBy?.name || "Admin"} on {new Date(item.resolvedAt || item.updatedAt).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        )}
                      </td>

                      <td className="p-4">
                        {item.status === "Pending" ? (
                          <button
                            onClick={() => handleOpenResolve(item)}
                            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium px-3 py-1.5 rounded-lg transition shadow-sm"
                          >
                            Resolve Flag
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">Closed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Resolution Modal */}
        {selectedDispute && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span>⚖️</span> Moderate Reported Dispute
                </h3>
                <button
                  onClick={() => setSelectedDispute(null)}
                  className="text-gray-400 hover:text-gray-600 text-lg"
                >
                  ✕
                </button>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl mb-4 text-xs space-y-1">
                <p><strong>Target Type:</strong> <span className="uppercase">{selectedDispute.targetType || 'User'}</span></p>
                <p><strong>Reported By:</strong> {selectedDispute.reporter?.name || 'User'} ({selectedDispute.reporter?.email})</p>
                <p><strong>Reported Party:</strong> {selectedDispute.reportedUser?.name || 'Entity'}</p>
                <p className="pt-1 text-slate-700"><strong>Reason:</strong> "{selectedDispute.reason}"</p>
              </div>

              <form onSubmit={handleSubmitResolve} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Resolution Action <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={resolutionAction}
                    onChange={(e) => setResolutionAction(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="dismiss">Dismiss Flag (No violation found)</option>
                    <option value="warn_user">Warn User (Send official warning notification)</option>
                    <option value="remove_content">Remove / Suspend Content (Deactivate listing, remove review, or suspend user)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Resolution Note (Audit Trail)
                  </label>
                  <textarea
                    value={resolutionNote}
                    onChange={(e) => setResolutionNote(e.target.value)}
                    placeholder="Enter reason or note for this administrative decision..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 bg-slate-50"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedDispute(null)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-sm font-medium hover:bg-rose-700 disabled:opacity-50 transition shadow-sm"
                  >
                    {actionLoading ? "Resolving..." : "Submit Resolution"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFlagsPage;