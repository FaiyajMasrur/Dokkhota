// Messages page for Dokkhota — shows list of active chat conversations
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import messageService from '../services/messageService.js';
import { Link } from 'react-router-dom';

const MessagesPage = () => {
  const { user, accessToken, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!isAuthenticated) {
        setLoading(false);
        return;
      }
      try {
        const res = await messageService.getConversations(accessToken);
        setConversations(res.data.conversations || []);
      } catch (err) {
        console.error('Failed to load conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [accessToken, isAuthenticated]);

  return (
    <div className='min-h-screen bg-slate-50'>
      <div className='max-w-4xl mx-auto px-4 py-10'>
        <div className='bg-white rounded-3xl p-8 shadow-sm'>
          <div className='flex items-center justify-between mb-6'>
            <div>
              <h1 className='text-3xl font-semibold'>Messages</h1>
              <p className='text-gray-600 mt-1'>Connect and chat in real-time with your session partners.</p>
            </div>
            <Link to='/dashboard' className='text-sm text-green-700 font-medium hover:underline'>
              Back to Dashboard →
            </Link>
          </div>

          {loading ? (
            <p className='text-gray-500 py-6'>Loading your conversations...</p>
          ) : conversations.length > 0 ? (
            <div className='divide-y border rounded-2xl overflow-hidden'>
              {conversations.map((conv) => {
                const partner = conv.user;
                if (!partner) return null;

                const hasUnread = conv.unreadCount > 0;
                const formattedTime = conv.lastMessageTime
                  ? new Date(conv.lastMessageTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : '';

                return (
                  <Link
                    key={partner._id}
                    to={`/messages/${partner._id}`}
                    className='flex items-center justify-between p-4 hover:bg-slate-50 transition'
                  >
                    <div className='flex items-center gap-4'>
                      {/* Avatar */}
                      <div className='w-12 h-12 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-lg overflow-hidden border'>
                        {partner.avatarUrl ? (
                          <img src={partner.avatarUrl} alt={partner.name} className='w-full h-full object-cover' />
                        ) : (
                          partner.name?.charAt(0).toUpperCase() || 'U'
                        )}
                      </div>

                      {/* Info */}
                      <div>
                        <div className='flex items-center gap-2'>
                          <h3 className='font-semibold text-gray-900'>{partner.name}</h3>
                          {hasUnread && (
                            <span className='bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full'>
                              {conv.unreadCount} new
                            </span>
                          )}
                        </div>
                        <p className={`text-sm mt-0.5 truncate max-w-xs ${hasUnread ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
                          {conv.lastMessage || 'No messages yet. Tap to start chatting!'}
                        </p>
                      </div>
                    </div>

                    <div className='text-right'>
                      <span className='text-xs text-gray-400'>{formattedTime}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className='text-center py-12 border rounded-2xl bg-slate-50'>
              <p className='text-gray-600 font-medium'>No active conversations yet.</p>
              <p className='text-sm text-gray-500 mt-1'>
                Book a session or accept a booking request from your dashboard to start chatting!
              </p>
              <Link to='/dashboard' className='inline-block mt-4 bg-green-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-green-700 transition'>
                Go to Dashboard
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
