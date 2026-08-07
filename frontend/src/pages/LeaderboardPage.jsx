import { useEffect, useState } from "react";

const LeaderboardPage = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/leaderboard")
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
      })
      .catch((err) => console.log(err));
  }, []);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="bg-white rounded-3xl p-8 shadow-sm">

          <h1 className="text-3xl font-semibold mb-4">
            Leaderboard
          </h1>

          <p className="text-gray-600 mb-6">
            Top Rated Skill Providers
          </p>

          <table className="w-full border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border p-3">Rank</th>
                <th className="border p-3">Name</th>
                <th className="border p-3">Credits</th>
                <th className="border p-3">Verified</th>
              </tr>
            </thead>

            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="text-center p-5 text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user, index) => (
                  <tr key={user._id}>
                    <td className="border p-3">
                      #{index + 1}
                    </td>

                    <td className="border p-3">
                      {user.name}
                    </td>

                    <td className="border p-3">
                      {user.creditBalance}
                    </td>

                    <td className="border p-3">
                      {user.isVerified ? "Yes" : "No"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
};

export default LeaderboardPage;