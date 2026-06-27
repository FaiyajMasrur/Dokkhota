// Admin flag resolution page for Dokkhota
const AdminFlagsPage = () => {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold mb-4'>Flags</h1>
          <p className='text-gray-600 mb-4'>Resolve reports on listings, messages, and community activity.</p>
          <div className='rounded-3xl border p-6 text-gray-700'>
            <p className='text-sm text-gray-500'>No flag data is available until backend reporting is added.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminFlagsPage;
