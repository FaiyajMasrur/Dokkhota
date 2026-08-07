import { useEffect, useState } from "react";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5000/api/notifications", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
      })
      .catch((err) => console.log(err));
  }, []);

  const markRead = async (id) => {
    await fetch(`http://localhost:5000/api/notifications/${id}`, {
      method: "PUT",
      credentials: "include",
    });

    setNotifications((old) =>
      old.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      )
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-8">

        <h1 className="text-3xl font-bold mb-6">
          Notifications
        </h1>

        {notifications.length === 0 ? (
          <div className="bg-white p-5 rounded-xl shadow">
            No notifications available.
          </div>
        ) : (
          notifications.map((item) => (
            <div
              key={item._id}
              className="bg-white rounded-xl shadow p-5 mb-4"
            >
              <h2 className="font-semibold">
                {item.title}
              </h2>

              <p className="text-gray-600 my-2">
                {item.message}
              </p>

              <p className="text-sm text-gray-500">
                {new Date(item.createdAt).toLocaleString()}
              </p>

              {!item.isRead && (
                <button
                  onClick={() => markRead(item._id)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Mark as Read
                </button>
              )}
            </div>
          ))
        )}

      </div>
    </div>
  );
};

export default NotificationsPage;