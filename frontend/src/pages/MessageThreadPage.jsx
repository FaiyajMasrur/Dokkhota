// Message thread view for Dokkhota — Real-Time Chat interface using Socket.IO & MongoDB persistence
import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import messageService from '../services/messageService.js';
import { io } from 'socket.io-client';

const MessageThreadPage = () => {
  const { userId: partnerId } = useParams();
  const { user, accessToken, isAuthenticated } = useAuth();
  const currentUserId = user?.id || user?._id;

  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ── Setup Socket.IO connection & fetch messages ───────────────────────
  useEffect(() => {
    if (!isAuthenticated || !currentUserId) return;

    // 1. Initialize Socket.IO connection
    const socket = io('http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    // Join personal socket room
    socket.emit('join', currentUserId);

    // Listen for incoming messages
    socket.on('receive_message', (newMessage) => {
      // Check if message belongs to current thread
      if (
        (newMessage.senderId?._id || newMessage.senderId) === partnerId ||
        (newMessage.senderId?._id || newMessage.senderId) === currentUserId
      ) {
        setMessages((prev) => [...prev, newMessage]);
      }
    });

    // Listen for typing indicators
    socket.on('user_typing', ({ senderId }) => {
      if (senderId === partnerId) setIsTyping(true);
    });

    socket.on('user_stop_typing', ({ senderId }) => {
      if (senderId === partnerId) setIsTyping(false);
    });

    // 2. Fetch past message history via REST API
    const fetchThread = async () => {
      try {
        const res = await messageService.getMessages(partnerId, accessToken);
        setPartner(res.data.partner);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error('Failed to load thread:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchThread();

    return () => {
      socket.disconnect();
    };
  }, [accessToken, currentUserId, isAuthenticated, partnerId]);

  // ── Handle sending message ───────────────────────────────────────────
  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');

    // Emit typing stop
    socketRef.current?.emit('stop_typing', { senderId: currentUserId, receiverId: partnerId });

    try {
      // Send via REST API for robust persistence & immediate UI state
      const res = await messageService.sendMessage(
        { receiverId: partnerId, content },
        accessToken
      );
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.message]);

        // Also emit via socket for instant recipient notification
        socketRef.current?.emit('send_message', {
          senderId: currentUserId,
          receiverId: partnerId,
          content,
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  // ── Handle typing status ─────────────────────────────────────────────
  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (socketRef.current) {
      socketRef.current.emit('typing', { senderId: currentUserId, receiverId: partnerId });
    }
  };

  return (
    <div className='min-h-screen bg-slate-50 py-6 px-4'>
      <div className='max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border overflow-hidden flex flex-col h-[85vh]'>

        {/* ── Thread Header ────────────────────────────────────────────── */}
        <div className='p-4 border-b bg-white flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Link to='/messages' className='p-2 rounded-xl hover:bg-slate-100 text-gray-600 transition'>
              ← Back
            </Link>
            <div className='w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center font-bold text-base overflow-hidden border'>
              {partner?.avatarUrl ? (
                <img src={partner.avatarUrl} alt={partner.name} className='w-full h-full object-cover' />
              ) : (
                partner?.name?.charAt(0).toUpperCase() || 'U'
              )}
            </div>
            <div>
              <h2 className='font-semibold text-gray-900'>{partner?.name || 'Loading user...'}</h2>
              <p className='text-xs text-gray-500'>{partner?.email || 'Skill match'}</p>
            </div>
          </div>

          <Link to='/dashboard' className='text-xs font-medium text-green-700 hover:underline'>
            Dashboard
          </Link>
        </div>

        {/* ── Message Bubble Container ─────────────────────────────────── */}
        <div className='flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50'>
          {loading ? (
            <p className='text-center text-gray-500 py-10'>Loading conversation...</p>
          ) : messages.length > 0 ? (
            messages.map((msg, index) => {
              const msgSenderId = msg.senderId?._id || msg.senderId;
              const isMine = msgSenderId === currentUserId;
              const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

              return (
                <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                    isMine
                      ? 'bg-green-600 text-white rounded-br-none'
                      : 'bg-white border text-gray-900 rounded-bl-none'
                  }`}>
                    <p className='text-sm whitespace-pre-wrap leading-relaxed'>{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMine ? 'text-green-100' : 'text-gray-400'}`}>
                      {time}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className='text-center py-16 text-gray-400'>
              <p className='text-lg font-medium'>No messages yet!</p>
              <p className='text-sm mt-1'>Say hello to start the conversation.</p>
            </div>
          )}

          {/* Typing Indicator */}
          {isTyping && (
            <div className='flex justify-start'>
              <div className='bg-white border rounded-2xl rounded-bl-none px-4 py-2 text-xs text-gray-500 italic animate-pulse'>
                {partner?.name || 'User'} is typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Footer ─────────────────────────────────────────────── */}
        <form onSubmit={handleSend} className='p-4 bg-white border-t flex items-center gap-3'>
          <input
            type='text'
            value={inputText}
            onChange={handleInputChange}
            placeholder='Type your message...'
            className='flex-1 border rounded-2xl px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 bg-slate-50'
          />
          <button
            type='submit'
            disabled={!inputText.trim()}
            className='bg-green-600 text-white px-6 py-3 rounded-2xl font-medium text-sm hover:bg-green-700 disabled:opacity-50 transition shadow-sm'
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default MessageThreadPage;
