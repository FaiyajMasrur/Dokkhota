// Admin users management page for Dokkhota
const AdminUsersPage = () => {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold mb-4'>Users</h1>
          <p className='text-gray-600 mb-4'>View registered users and manage account status.</p>
          <div className='space-y-4 text-gray-700'>
            <div className='rounded-3xl border p-6'>
              <h2 className='font-semibold'>No users loaded yet</h2>
              <p className='text-sm text-gray-500'>This admin page is ready for backend user management integration.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersPage;
