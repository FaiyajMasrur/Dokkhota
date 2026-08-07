// Admin dispute resolution page for Dokkhota
import { useEffect, useState } from "react";

const AdminFlagsPage = () => {

  const [disputes, setDisputes] = useState([]);

  const loadDisputes = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/admin/disputes");
      const data = await res.json();
      setDisputes(data.disputes || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    loadDisputes();
  }, []);

  const resolveDispute = async (id) => {

    await fetch(`http://localhost:5000/api/admin/disputes/${id}`, {
      method: "PUT",
    });

    loadDisputes();
  };

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-6xl mx-auto px-4 py-10">

        <div className="bg-white rounded-3xl p-8 shadow-sm">

          <h1 className="text-3xl font-semibold mb-4">
            Dispute Resolution
          </h1>

          <p className="text-gray-600 mb-6">
            Review disputes reported by users.
          </p>

          <div className="overflow-x-auto">

            <table className="w-full border border-gray-300">

              <thead className="bg-gray-100">

                <tr>

                  <th className="border p-3">Reporter</th>

                  <th className="border p-3">Reported User</th>

                  <th className="border p-3">Reason</th>

                  <th className="border p-3">Status</th>

                  <th className="border p-3">Action</th>

                </tr>

              </thead>

              <tbody>

                {disputes.length === 0 ? (

                  <tr>

                    <td colSpan="5" className="text-center p-5">
                      No disputes found.
                    </td>

                  </tr>

                ) : (

                  disputes.map((item) => (

                    <tr key={item._id}>

                      <td className="border p-3">
                        {item.reporter?.name}
                      </td>

                      <td className="border p-3">
                        {item.reportedUser?.name}
                      </td>

                      <td className="border p-3">
                        {item.reason}
                      </td>

                      <td className="border p-3">
                        {item.status}
                      </td>

                      <td className="border p-3">

                        {item.status === "Pending" ? (

                          <button
                            onClick={() => resolveDispute(item._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded"
                          >
                            Resolve
                          </button>

                        ) : (

                          <span className="text-green-600 font-semibold">
                            Resolved
                          </span>

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