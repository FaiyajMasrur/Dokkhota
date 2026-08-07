// Admin panel page for Dokkhota admins
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

const AdminPanelPage = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalBookings: 0,
    totalDisputes: 0,
    totalCredits: 0,
  });

  useEffect(() => {
    fetch('http://localhost:5000/api/admin/dashboard')
      .then((res) => res.json())
      .then((data) => {
        setStats({
          totalUsers: data.totalUsers || 0,
          totalBookings: data.totalBookings || 0,
          totalDisputes: data.totalDisputes || 0,
          totalCredits: data.totalCredits || 0,
        });
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">

        <div className="bg-white rounded-3xl p-8 shadow-sm">

          <h1 className="text-3xl font-semibold mb-2">
            Admin Dashboard
          </h1>

          <p className="text-gray-600 mb-8">
            Manage users, categories, flags and badge approvals.
          </p>

          {/* Dashboard Statistics */}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">

            <div className="bg-blue-100 rounded-xl p-5 text-center">
              <h2 className="text-lg font-semibold">Users</h2>
              <p className="text-3xl font-bold">
                {stats.totalUsers}
              </p>
            </div>

            <div className="bg-green-100 rounded-xl p-5 text-center">
              <h2 className="text-lg font-semibold">Bookings</h2>
              <p className="text-3xl font-bold">
                {stats.totalBookings}
              </p>
            </div>

            <div className="bg-red-100 rounded-xl p-5 text-center">
              <h2 className="text-lg font-semibold">Disputes</h2>
              <p className="text-3xl font-bold">
                {stats.totalDisputes}
              </p>
            </div>

            <div className="bg-yellow-100 rounded-xl p-5 text-center">
              <h2 className="text-lg font-semibold">Credits</h2>
              <p className="text-3xl font-bold">
                {stats.totalCredits}
              </p>
            </div>

          </div>

          {/* Existing Cards */}

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

            <Link
              to="/admin/users"
              className="block rounded-3xl border p-6 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2">
                Users
              </h2>

              <p className="text-gray-600">
                Review and manage registered users.
              </p>

            </Link>

            <Link
              to="/admin/categories"
              className="block rounded-3xl border p-6 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2">
                Categories
              </h2>

              <p className="text-gray-600">
                Edit skill categories and tags.
              </p>

            </Link>

            <Link
              to="/admin/flags"
              className="block rounded-3xl border p-6 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2">
                Flags
              </h2>

              <p className="text-gray-600">
                Resolve reported listings and users.
              </p>

            </Link>

            <Link
              to="/admin/badges"
              className="block rounded-3xl border p-6 hover:shadow-md"
            >
              <h2 className="text-xl font-semibold mb-2">
                Badges
              </h2>

              <p className="text-gray-600">
                Approve community badge requests.
              </p>

            </Link>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminPanelPage;