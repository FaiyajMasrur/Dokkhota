import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import notificationService from '../services/notificationService.js';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    const fetchUnread = async () => {
      try {
        const data = await notificationService.getNotifications();
        if (data && typeof data.unreadCount === 'number') {
          setUnreadCount(data.unreadCount);
        }
      } catch (err) {
        // Silently ignore notification count fetch errors
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <nav className='bg-white border-b shadow-sm sticky top-0 z-50'>
      <div className='max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between'>
        {/* Left side links */}
        <div className='flex items-center gap-5'>
          <Link to='/' className='text-xl font-extrabold text-emerald-700 tracking-tight flex items-center gap-1.5'>
            <span>Dokkhota</span>
          </Link>
          <Link to='/explore' className='text-sm text-slate-600 hover:text-emerald-700 font-medium transition'>
            Explore
          </Link>
          <Link to='/requests' className='text-sm text-slate-600 hover:text-emerald-700 font-medium transition'>
            Request Board
          </Link>
          <Link to='/leaderboard' className='text-sm text-slate-600 hover:text-emerald-700 font-medium transition'>
            Leaderboard
          </Link>
        </div>

        {/* Right side links */}
        <div className='flex items-center gap-4 text-sm'>
          {isAuthenticated ? (
            <>
              <Link to='/dashboard' className='text-slate-600 hover:text-emerald-700 font-medium transition'>
                Dashboard
              </Link>

              <Link to='/notifications' className='relative text-slate-600 hover:text-emerald-700 font-medium transition flex items-center gap-1'>
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className='bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full'>
                    {unreadCount}
                  </span>
                )}
              </Link>

              <Link to='/session-history' className='text-slate-600 hover:text-emerald-700 font-medium transition'>
                Sessions
              </Link>
              <Link to='/credit-history' className='text-slate-600 hover:text-emerald-700 font-medium transition'>
                Credits
              </Link>
              <Link to='/messages' className='text-slate-600 hover:text-emerald-700 font-medium transition'>
                Messages
              </Link>
              <Link
                to={`/profile/${user?.id || user?._id}`}
                className='text-slate-600 hover:text-emerald-700 font-medium transition'
              >
                My Profile
              </Link>
              <Link
                to='/create-listing'
                className='bg-emerald-600 text-white px-3.5 py-1.5 rounded-xl font-medium hover:bg-emerald-700 transition text-xs shadow-sm'
              >
                + Create Listing
              </Link>

              {/* Admin-only link */}
              {user?.role === 'admin' && (
                <Link
                  to='/admin'
                  className='text-amber-700 font-bold hover:text-amber-800 bg-amber-100 px-2.5 py-1 rounded-xl text-xs transition'
                >
                  Admin Panel
                </Link>
              )}

              <button
                onClick={handleLogout}
                className='text-rose-600 hover:text-rose-800 font-medium text-xs ml-1 transition'
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to='/login' className='text-slate-600 hover:text-emerald-700 font-medium transition'>
                Login
              </Link>
              <Link
                to='/register'
                className='bg-emerald-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-emerald-700 transition shadow-sm text-xs'
              >
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;