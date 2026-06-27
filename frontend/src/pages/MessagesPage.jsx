// Messages page for Dokkhota
const MessagesPage = () => {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold mb-4'>Messages</h1>
          <p className='text-gray-600 mb-6'>Review your conversations and contact other learners or providers.</p>
          <div className='rounded-3xl border p-6 text-gray-700'>
            <p className='text-sm text-gray-500'>Messaging will connect once the backend chat service is implemented.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
