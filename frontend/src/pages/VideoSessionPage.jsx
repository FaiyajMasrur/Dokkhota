// Video session page for Dokkhota
const VideoSessionPage = () => {
  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-5xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <h1 className='text-3xl font-semibold mb-4'>Video session</h1>
          <p className='text-gray-600'>Live session streaming and video calls will be available here.</p>
          <div className='rounded-3xl border p-6 text-gray-700'>
            <p className='text-sm text-gray-500'>Video session integration is pending WebRTC backend wiring.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSessionPage;
