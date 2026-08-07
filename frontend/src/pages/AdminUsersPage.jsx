// Admin users management page for Dokkhota
import { useEffect, useState } from "react";

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);

  const loadUsers = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const suspendUser = async (id) => {
    await fetch(`http://localhost:5000/api/admin/users/${id}/suspend`, {
      method: "PUT",
    });

    loadUsers();
  };

  const activateUser = async (id) => {
    await fetch(`http://localhost:5000/api/admin/users/${id}/unsuspend`, {
      method: "PUT",
    });

    loadUsers();
  };

  const deleteUser = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this user?"
    );

    if (!confirmDelete) return;

    await fetch(`http://localhost:5000/api/admin/users/${id}`, {
      method: "DELETE",
    });

    loadUsers();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm">

          <h1 className="text-3xl font-semibold mb-4">
            User Management
          </h1>

          <p className="text-gray-600 mb-6">
            View, suspend, activate or delete users.
          </p>

          <div className="overflow-x-auto">

            <table className="w-full border border-gray-300">

              <thead className="bg-gray-100">

                <tr>

                  <th className="border p-3">Name</th>

                  <th className="border p-3">Email</th>

                  <th className="border p-3">Role</th>

                  <th className="border p-3">Status</th>

                  <th className="border p-3">Actions</th>

                </tr>

              </thead>

              <tbody>

                {users.length === 0 ? (

                  <tr>

                    <td
                      colSpan="5"
                      className="text-center p-5"
                    >
                      No Users Found
                    </td>

                  </tr>

                ) : (

                  users.map((user) => (

                    <tr key={user._id}>

                      <td className="border p-3">
                        {user.name}
                      </td>

                      <td className="border p-3">
                        {user.email}
                      </td>

                      <td className="border p-3">
                        {user.role}
                      </td>

                      <td className="border p-3">
                        {user.isSuspended ? "Suspended" : "Active"}
                      </td>

                      <td className="border p-3 space-x-2">

                        <button
                          onClick={() => suspendUser(user._id)}
                          className="bg-yellow-500 text-white px-3 py-1 rounded"
                        >
                          Suspend
                        </button>

                        <button
                          onClick={() => activateUser(user._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded"
                        >
                          Activate
                        </button>

                        <button
                          onClick={() => deleteUser(user._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded"
                        >
                          Delete
                        </button>

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