import { useEffect, useState } from "react";
import notificationService from "../services/notificationService.js";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");
      const data = await notificationService.getNotifications();
      if (data.notifications) {
        setNotifications(data.notifications);
      }
    } catch (err) {
      console.error("Notifications fetch error:", err);
      setError("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((old) =>
        old.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Mark read error:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications((old) => old.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Mark all read error:", err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications((old) => old.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Delete notification error:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-slate-800">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-emerald-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-sm mt-1">
                Real-time booking requests, session updates, credit events, and reminders.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-semibold px-3 py-2 rounded-xl transition"
                >
                  Mark all as read
                </button>
              )}
              <button
                onClick={loadNotifications}
                className="text-xs bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-3 py-2 rounded-xl transition"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex border-b border-slate-200 mb-6 gap-6">
            <button
              onClick={() => setFilter("all")}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                filter === "all"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              All Notifications ({notifications.length})
            </button>
            <button
              onClick={() => setFilter("unread")}
              className={`pb-3 text-sm font-semibold border-b-2 transition ${
                filter === "unread"
                  ? "border-emerald-600 text-emerald-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Unread ({unreadCount})
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading notifications...</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-10 text-center border border-dashed border-slate-200">
              <p className="text-slate-500 font-medium">No notifications found.</p>
              <p className="text-xs text-slate-400 mt-1">
                You'll receive alerts when someone books your session, accepts a booking, or updates credits.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredNotifications.map((item) => (
                <div
                  key={item._id}
                  className={`rounded-2xl p-5 border transition flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    item.isRead
                      ? "bg-white border-slate-200 opacity-90"
                      : "bg-emerald-50/40 border-emerald-200 shadow-sm"
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          item.type === "credit"
                            ? "bg-purple-100 text-purple-800"
                            : item.type === "message"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.type || "booking"}
                      </span>
                      <h2 className="font-semibold text-slate-800 text-base">{item.title}</h2>
                    </div>

                    <p className="text-slate-600 text-sm my-1">{item.message}</p>

                    <p className="text-xs text-slate-400 mt-2">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {!item.isRead && (
                      <button
                        onClick={() => markRead(item._id)}
                        className="text-xs bg-emerald-600 text-white font-medium px-3 py-1.5 rounded-lg hover:bg-emerald-700 transition"
                      >
                        Mark as Read
                      </button>
                    )}
                    <button
                      onClick={() => deleteNotification(item._id)}
                      className="text-xs text-slate-400 hover:text-rose-600 p-1.5 transition"
                      title="Delete notification"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;