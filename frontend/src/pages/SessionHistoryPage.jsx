import { useEffect, useState } from "react";

const SessionHistoryPage = () => {

  const [sessions, setSessions] = useState([]);

  useEffect(() => {

    fetch("http://localhost:5000/api/session-history", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
      });

  }, []);

  return (
    <div className="min-h-screen bg-slate-50">

      <div className="max-w-5xl mx-auto p-8">

        <div className="bg-white rounded-3xl shadow-sm p-8">

          <h1 className="text-3xl font-bold mb-6">
            Session History
          </h1>

          <table className="w-full border">

            <thead className="bg-gray-100">

              <tr>

                <th className="border p-3">Teacher</th>

                <th className="border p-3">Learner</th>

                <th className="border p-3">Skill</th>

                <th className="border p-3">Date</th>

                <th className="border p-3">Status</th>

              </tr>

            </thead>

            <tbody>

              {sessions.length === 0 ? (

                <tr>

                  <td
                    colSpan="5"
                    className="text-center p-5"
                  >
                    No Session History
                  </td>

                </tr>

              ) : (

                sessions.map((session) => (

                  <tr key={session._id}>

                    <td className="border p-3">
                      {session.teacherId?.name}
                    </td>

                    <td className="border p-3">
                      {session.learnerId?.name}
                    </td>

                    <td className="border p-3">
                      {session.skill}
                    </td>

                    <td className="border p-3">
                      {new Date(session.sessionDate).toLocaleDateString()}
                    </td>

                    <td className="border p-3">
                      {session.status}
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

export default SessionHistoryPage;