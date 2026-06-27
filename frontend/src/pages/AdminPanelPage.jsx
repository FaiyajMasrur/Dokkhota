// Admin panel page for Dokkhota admins
import { Link } from 'react-router-dom';

const AdminPanelPage = () => {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold mb-4'>Admin dashboard</h1>
          <p className='text-gray-600 mb-6'>Manage users, categories, flags, and badge approvals.</p>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <Link to='/admin/users' className='block rounded-3xl border p-6 hover:shadow-md'>
              <h2 className='text-xl font-semibold mb-2'>Users</h2>
              <p className='text-gray-600'>Review and manage registered users.</p>
            </Link>
            <Link to='/admin/categories' className='block rounded-3xl border p-6 hover:shadow-md'>
              <h2 className='text-xl font-semibold mb-2'>Categories</h2>
              <p className='text-gray-600'>Edit skill categories and tags.</p>
            </Link>
            <Link to='/admin/flags' className='block rounded-3xl border p-6 hover:shadow-md'>
              <h2 className='text-xl font-semibold mb-2'>Flags</h2>
              <p className='text-gray-600'>Resolve reported listings and users.</p>
            </Link>
            <Link to='/admin/badges' className='block rounded-3xl border p-6 hover:shadow-md'>
              <h2 className='text-xl font-semibold mb-2'>Badges</h2>
              <p className='text-gray-600'>Approve community badge requests.</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanelPage;
