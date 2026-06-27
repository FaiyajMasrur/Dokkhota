// Navbar component for Dokkhota navigation and auth-aware links
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className='bg-white border-b shadow-sm'>
      <div className='max-w-6xl mx-auto px-4 py-4 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Link to='/' className='text-xl font-bold text-green-700'>Dokkhota</Link>
          <Link to='/explore' className='text-gray-600 hover:text-green-700'>Explore</Link>
          <Link to='/requests' className='text-gray-600 hover:text-green-700'>Request Board</Link>
        </div>
        <div className='flex items-center gap-4'>
          {isAuthenticated ? (
            <>
              <Link to='/dashboard' className='text-gray-600 hover:text-green-700'>Dashboard</Link>
              <Link to={`/profile/${user?.id || user?._id}`} className='text-gray-600 hover:text-green-700'>My profile</Link>
              <Link to='/create-listing' className='text-gray-600 hover:text-green-700'>Create Listing</Link>
              <button onClick={logout} className='text-red-600 hover:text-red-800'>Logout</button>
            </>
          ) : (
            <>
              <Link to='/login' className='text-gray-600 hover:text-green-700'>Login</Link>
              <Link to='/register' className='bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700'>Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
