// Admin users management page for Dokkhota
import { useEffect, useState } from "react";
import adminService from "../services/adminService.js";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await adminService.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      console.error("Admin load users error:", err);
      setError("Failed to load user accounts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const suspendUser = async (id, userName) => {
    const reason = window.prompt(
      `Please provide a reason for suspending ${userName || 'this user'} (mandatory):`
    );
    if (!reason || !reason.trim()) {
      alert('A suspension reason is mandatory.');
      return;
    }

    try {
      await adminService.suspendUser(id, reason.trim());
      loadUsers();
    } catch (err) {
      console.error("Suspend error:", err);
      setError(err.response?.data?.message || "Failed to suspend user.");
    }
  };

  const activateUser = async (id) => {
    try {
      await adminService.unsuspendUser(id);
      loadUsers();
    } catch (err) {
      console.error("Activate error:", err);
      setError(err.response?.data?.message || "Failed to activate user.");
    }
  };

  const deleteUser = async (id, userName) => {
    const reason = window.prompt(
      `Are you sure you want to permanently delete ${userName || 'this user'}? Enter a reason:`
    );
    if (reason === null) return;

    try {
      await adminService.deleteUser(id, reason.trim());
      loadUsers();
    } catch (err) {
      console.error("Delete error:", err);
      setError(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-800">User Management</h1>
              <p className="text-slate-500 text-sm mt-1">
                View, suspend, activate or delete user accounts across Dokkhota.
              </p>
            </div>

            <input
              type="text"
              placeholder="Search user by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 w-full md:w-72"
            />
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
                  <th className="p-4 border-b">User</th>
                  <th className="p-4 border-b">Email</th>
                  <th className="p-4 border-b">Role</th>
                  <th className="p-4 border-b">Credits</th>
                  <th className="p-4 border-b">Status</th>
                  <th className="p-4 border-b">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      Loading users...
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-10 text-slate-400">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user._id} className="hover:bg-slate-50 transition">
                      <td className="p-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                            {user.name?.[0]}
                          </span>
                          {user.name}
                        </div>
                      </td>

                      <td className="p-4 text-slate-600">{user.email}</td>

                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                            user.role === "admin"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          {user.role}
                        </span>
                      </td>

                      <td className="p-4 font-bold text-emerald-600">{user.creditBalance ?? 0} SC</td>

                      <td className="p-4">
                        {user.isSuspended ? (
                          <div>
                            <span className="bg-rose-100 text-rose-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                              Suspended
                            </span>
                            {user.suspensionReason && (
                              <p className="text-[11px] text-rose-700 mt-1 max-w-xs truncate" title={user.suspensionReason}>
                                Reason: {user.suspensionReason}
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                            Active
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          {!user.isSuspended ? (
                            <button
                              onClick={() => suspendUser(user._id, user.name)}
                              className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-medium px-3 py-1.5 rounded-lg transition"
                            >
                              Suspend
                            </button>
                          ) : (
                            <button
                              onClick={() => activateUser(user._id)}
                              className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                            >
                              Activate
                            </button>
                          )}

                          <button
                            onClick={() => deleteUser(user._id, user.name)}
                            className="text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium px-3 py-1.5 rounded-lg transition"
                          >
                            Delete
                          </button>
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

export default AdminUsersPage;