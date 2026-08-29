// Admin panel page for Dokkhota admins
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import adminService from '../services/adminService.js';

const AdminPanelPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    activeListings: 0,
    sessionsThisWeek: 0,
    sessionsThisMonth: 0,
    totalDisputes: 0,
    totalCredits: 0,
    topFlags: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminService.getDashboard();
      setStats({
        totalUsers: data.totalUsers || 0,
        totalBookings: data.totalBookings || 0,
        activeListings: data.activeListings || 0,
        sessionsThisWeek: data.sessionsThisWeek || 0,
        sessionsThisMonth: data.sessionsThisMonth || 0,
        totalDisputes: data.totalDisputes || 0,
        totalCredits: data.totalCredits || 0,
        topFlags: data.topFlags || [],
      });
    } catch (err) {
      console.error('Admin dashboard stats error:', err);
      setError('Failed to load admin statistics. Ensure you have admin privileges.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-slate-800">Admin Dashboard</h1>
            <button
              onClick={loadStats}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl transition shadow-sm"
            >
              Refresh Stats
            </button>
          </div>

          <p className="text-slate-500 text-sm mb-8">
            Platform oversight, user account management, dispute resolution, categories, and badge approvals.
          </p>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Dashboard Statistics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center">
              <h2 className="text-xs font-semibold text-blue-700 uppercase tracking-wider">Total Users</h2>
              <p className="text-2xl font-extrabold text-blue-900 mt-1">
                {loading ? '...' : stats.totalUsers}
              </p>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 text-center">
              <h2 className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Active Listings</h2>
              <p className="text-2xl font-extrabold text-indigo-900 mt-1">
                {loading ? '...' : stats.activeListings}
              </p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center">
              <h2 className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">Bookings</h2>
              <p className="text-2xl font-extrabold text-emerald-900 mt-1">
                {loading ? '...' : stats.totalBookings}
              </p>
            </div>

            <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 text-center">
              <h2 className="text-xs font-semibold text-teal-700 uppercase tracking-wider">Sessions (Week/Mo)</h2>
              <p className="text-lg font-extrabold text-teal-900 mt-1">
                {loading ? '...' : `${stats.sessionsThisWeek} / ${stats.sessionsThisMonth}`}
              </p>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 text-center">
              <h2 className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Pending Flags</h2>
              <p className="text-2xl font-extrabold text-rose-900 mt-1">
                {loading ? '...' : stats.totalDisputes}
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-center">
              <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Total Credits</h2>
              <p className="text-2xl font-extrabold text-amber-900 mt-1">
                {loading ? '...' : stats.totalCredits} <span className="text-xs font-normal">SC</span>
              </p>
            </div>
          </div>

          {/* Action Navigation Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4 mb-10">
            <Link
              to="/admin/users"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-400 transition bg-white"
            >
              <div className="text-2xl mb-2">👥</div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Users</h2>
              <p className="text-xs text-slate-500">
                Review, suspend with reason, reactivate, or delete user accounts.
              </p>
            </Link>

            <Link
              to="/admin/categories"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-400 transition bg-white"
            >
              <div className="text-2xl mb-2">🏷️</div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Categories</h2>
              <p className="text-xs text-slate-500">
                Create, rename (with listing propagation), and toggle active state.
              </p>
            </Link>

            <Link
              to="/admin/flags"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-400 transition bg-white"
            >
              <div className="text-2xl mb-2">🚩</div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Disputes & Flags</h2>
              <p className="text-xs text-slate-500">
                Review reports with dismissal, warning, or content removal actions.
              </p>
            </Link>

            <Link
              to="/admin/badges"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-400 transition bg-white"
            >
              <div className="text-2xl mb-2">🎖️</div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">Verification Badges</h2>
              <p className="text-xs text-slate-500">
                Review skill certificates & approve verification badges.
              </p>
            </Link>
          </div>

          {/* Top Flagged Queue Section */}
          <div className="border border-slate-200 rounded-2xl p-6 bg-slate-50/50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-lg">Top Unresolved Flags</h3>
                <p className="text-xs text-slate-500">Recent community reports requiring administrator review.</p>
              </div>
              <Link
                to="/admin/flags"
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:underline"
              >
                View all flags →
              </Link>
            </div>

            {stats.topFlags?.length > 0 ? (
              <div className="space-y-3">
                {stats.topFlags.map((flag) => (
                  <div
                    key={flag._id}
                    className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 uppercase">
                          {flag.targetType || 'User'}
                        </span>
                        <span className="text-xs text-slate-500">
                          Reported by: <strong>{flag.reporter?.name || 'User'}</strong>
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-800 mt-1">"{flag.reason}"</p>
                    </div>
                    <Link
                      to="/admin/flags"
                      className="text-xs bg-rose-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-rose-700 text-center transition"
                    >
                      Resolve Flag
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">No pending flags! Platform is clean.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;