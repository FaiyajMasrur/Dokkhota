// Admin panel page for Dokkhota admins
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import adminService from '../services/adminService.js';

const AdminPanelPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalDisputes: 0,
    totalCredits: 0,
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
        totalDisputes: data.totalDisputes || 0,
        totalCredits: data.totalCredits || 0,
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
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-3 py-2 rounded-xl transition"
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

          {/* Dashboard Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-200 rounded-2xl p-5 text-center">
              <h2 className="text-sm font-semibold text-blue-700 uppercase tracking-wider">Total Users</h2>
              <p className="text-3xl font-extrabold text-blue-900 mt-2">
                {loading ? '...' : stats.totalUsers}
              </p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/50 border border-emerald-200 rounded-2xl p-5 text-center">
              <h2 className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Bookings</h2>
              <p className="text-3xl font-extrabold text-emerald-900 mt-2">
                {loading ? '...' : stats.totalBookings}
              </p>
            </div>

            <div className="bg-gradient-to-br from-rose-50 to-rose-100/50 border border-rose-200 rounded-2xl p-5 text-center">
              <h2 className="text-sm font-semibold text-rose-700 uppercase tracking-wider">Open Disputes</h2>
              <p className="text-3xl font-extrabold text-rose-900 mt-2">
                {loading ? '...' : stats.totalDisputes}
              </p>
            </div>

            <div className="bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200 rounded-2xl p-5 text-center">
              <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider">Credits Transacted</h2>
              <p className="text-3xl font-extrabold text-amber-900 mt-2">
                {loading ? '...' : stats.totalCredits} <span className="text-xs">SC</span>
              </p>
            </div>
          </div>

          {/* Action Cards */}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/admin/users"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-300 transition bg-slate-50/50"
            >
              <div className="text-2xl mb-2">👥</div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Users</h2>
              <p className="text-xs text-slate-500">
                Review, suspend, reactivate, or delete user accounts.
              </p>
            </Link>

            <Link
              to="/admin/categories"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-300 transition bg-slate-50/50"
            >
              <div className="text-2xl mb-2">🏷️</div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Categories</h2>
              <p className="text-xs text-slate-500">
                Create, rename, or deactivate skill categories.
              </p>
            </Link>

            <Link
              to="/admin/flags"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-300 transition bg-slate-50/50"
            >
              <div className="text-2xl mb-2">🚩</div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Disputes & Flags</h2>
              <p className="text-xs text-slate-500">
                Review reported user disputes and resolve issues.
              </p>
            </Link>

            <Link
              to="/admin/badges"
              className="block rounded-2xl border border-slate-200 p-6 hover:shadow-md hover:border-emerald-300 transition bg-slate-50/50"
            >
              <div className="text-2xl mb-2">🎖️</div>
              <h2 className="text-xl font-bold text-slate-800 mb-1">Verification Badges</h2>
              <p className="text-xs text-slate-500">
                Review skill certificates & approve verification badges.
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;