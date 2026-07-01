// Request card component for the request board
const RequestCard = ({ request, currentUserId, onRespond, onApprove, onReject, isOwner }) => {
  return (
    <div className='border rounded-3xl p-5 bg-white shadow-sm'>
      <div className='flex items-start justify-between gap-4 mb-3'>
        <div>
          <h3 className='text-lg font-semibold'>{request.title}</h3>
          <p className='text-sm text-gray-500'>{request.category}</p>
        </div>
        <span className='text-xs uppercase tracking-wide bg-green-100 text-green-700 px-3 py-1 rounded-full'>
          {request.status}
        </span>
      </div>
      <p className='text-gray-600 mb-3'>{request.description}</p>
      <div className='flex flex-wrap gap-2 mb-4'>
        {request.tags?.map((tag) => (
          <span key={tag} className='text-xs bg-gray-100 rounded-full px-3 py-1 text-gray-700'>#{tag}</span>
        ))}
      </div>
      <div className='text-sm text-gray-500 mb-4'>Budget: {request.preferredBudget || 0} SC • Format: {request.preferredFormat}</div>

      {isOwner ? (
        <div className='space-y-3'>
          {request.responses?.length > 0 ? request.responses.map((response) => (
            <div key={response._id} className='border rounded-2xl p-3 bg-slate-50'>
              <div className='flex items-center justify-between'>
                <span className='font-medium'>Responder: {response.responderId?.name || 'A learner'}</span>
                <span className='text-xs text-gray-500'>{response.status}</span>
              </div>
              {response.message && <p className='text-sm text-gray-600 mt-2'>{response.message}</p>}
              {response.status === 'pending' && (
                <div className='flex gap-2 mt-3'>
                  <button onClick={() => onApprove(request._id, response._id)} className='text-sm bg-green-600 text-white px-3 py-2 rounded-full'>Accept</button>
                  <button onClick={() => onReject(request._id, response._id)} className='text-sm border px-3 py-2 rounded-full'>Reject</button>
                </div>
              )}
            </div>
          )) : <p className='text-sm text-gray-500'>No responses yet.</p>}
        </div>
      ) : (
        <div className='flex items-center justify-between'>
          <span className='text-sm text-gray-500'>Posted by {request.requesterId?.name || 'a learner'}</span>
          <button onClick={() => onRespond(request._id)} className='bg-green-600 text-white rounded-full px-4 py-2 text-sm hover:bg-green-700'>Offer help</button>
        </div>
      )}

      {currentUserId && request.requesterId?._id?.toString() === currentUserId && !isOwner && (
        <div className='text-sm text-gray-500'>You created this request.</div>
      )}
    </div>
  );
};

export default RequestCard;
