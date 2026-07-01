// Request board page for Dokkhota
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import requestService from '../services/requestService.js';
import RequestCard from '../components/RequestCard.jsx';

const RequestBoardPage = () => {
  const { accessToken, user, isAuthenticated } = useAuth();
  const [requests, setRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', description: '', preferredFormat: 'online', preferredBudget: '0', tags: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    if (!accessToken) return;
    try {
      const [allResponse, mineResponse] = await Promise.all([
        requestService.getRequests(accessToken),
        requestService.getMyRequests(accessToken),
      ]);
      setRequests(allResponse.data.requests || []);
      setMyRequests(mineResponse.data.requests || []);
    } catch (error) {
      setRequests([]);
      setMyRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [accessToken]);

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!accessToken) {
      setMessage('Please sign in to post a request.');
      return;
    }

    try {
      const payload = {
        ...form,
        preferredBudget: Number(form.preferredBudget || 0),
        tags: form.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      };
      const response = await requestService.createRequest(payload, accessToken);
      if (response.data?.success) {
        setForm({ title: '', category: '', description: '', preferredFormat: 'online', preferredBudget: '0', tags: '' });
        setMessage('Request posted successfully.');
        fetchRequests();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not create your request.');
    }
  };

  const handleRespond = async (requestId) => {
    const responseMessage = window.prompt('Share a short note about how you can help:');
    if (!responseMessage) return;
    try {
      const response = await requestService.respondToRequest(requestId, responseMessage, accessToken);
      if (response.data?.success) {
        setMessage('Your offer was sent.');
        fetchRequests();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not send your offer.');
    }
  };

  const handleApprove = async (requestId, responseId) => {
    try {
      const response = await requestService.updateResponseStatus(requestId, responseId, 'accepted', accessToken);
      if (response.data?.success) {
        setMessage('Response accepted.');
        fetchRequests();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update the response.');
    }
  };

  const handleReject = async (requestId, responseId) => {
    try {
      const response = await requestService.updateResponseStatus(requestId, responseId, 'rejected', accessToken);
      if (response.data?.success) {
        setMessage('Response rejected.');
        fetchRequests();
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'Could not update the response.');
    }
  };

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-6xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm mb-8'>
          <h1 className='text-3xl font-semibold mb-4'>Request Board</h1>
          <p className='text-gray-600 mb-6'>Post what you need and connect with peers who can help.</p>
          {message && <div className='mb-4 text-sm text-green-700'>{message}</div>}
          <form className='grid gap-4 md:grid-cols-2' onSubmit={handleCreate}>
            <input value={form.title} onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))} className='border rounded px-4 py-3' placeholder='What do you need help with?' required />
            <input value={form.category} onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))} className='border rounded px-4 py-3' placeholder='Category' required />
            <textarea value={form.description} onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))} className='border rounded px-4 py-3 md:col-span-2' rows={3} placeholder='Describe your goal or the challenge.' required />
            <select value={form.preferredFormat} onChange={(event) => setForm((prev) => ({ ...prev, preferredFormat: event.target.value }))} className='border rounded px-4 py-3'>
              <option value='online'>Online</option>
              <option value='in-person'>In person</option>
            </select>
            <input type='number' min='0' value={form.preferredBudget} onChange={(event) => setForm((prev) => ({ ...prev, preferredBudget: event.target.value }))} className='border rounded px-4 py-3' placeholder='Budget in credits' />
            <input value={form.tags} onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))} className='border rounded px-4 py-3 md:col-span-2' placeholder='Tags (comma separated)' />
            <button type='submit' className='bg-green-600 text-white rounded-full px-5 py-3 hover:bg-green-700 md:col-span-2'>Post request</button>
          </form>
        </div>

        <div className='grid gap-6 lg:grid-cols-[1.1fr_0.9fr]'>
          <section>
            <h2 className='text-xl font-semibold mb-4'>Open requests</h2>
            {loading ? <p className='text-gray-600'>Loading requests...</p> : requests.length > 0 ? (
              <div className='space-y-4'>
                {requests.map((request) => (
                  <RequestCard
                    key={request._id}
                    request={request}
                    currentUserId={user?.id}
                    onRespond={handleRespond}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    isOwner={request.requesterId?._id?.toString() === user?.id}
                  />
                ))}
              </div>
            ) : <div className='bg-white rounded-3xl p-6 text-gray-600'>No requests yet.</div>}
          </section>

          <aside className='space-y-6'>
            <div className='bg-white rounded-3xl p-6 shadow-sm'>
              <h2 className='text-xl font-semibold mb-3'>Your requests</h2>
              {myRequests.length > 0 ? (
                <div className='space-y-3'>
                  {myRequests.map((request) => (
                    <div key={request._id} className='border rounded-2xl p-3'>
                      <div className='font-medium'>{request.title}</div>
                      <div className='text-sm text-gray-500'>{request.status}</div>
                    </div>
                  ))}
                </div>
              ) : <p className='text-gray-600'>You have not posted any requests yet.</p>}
            </div>
            <div className='bg-white rounded-3xl p-6 shadow-sm'>
              <h2 className='text-xl font-semibold mb-3'>Smart matching</h2>
              <p className='text-gray-600 text-sm'>The board now surfaces open requests and lets peers respond with offers for help. Matching is driven by the request and response flow.</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default RequestBoardPage;
