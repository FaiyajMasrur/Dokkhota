// Socket.IO event handler for Dokkhota real-time features
// Supports: Chat messaging, Typing indicators, WebRTC video call signaling
const Message = require('../models/Message');

module.exports = (io, socket) => {
  // ── Join personal room by userId ──────────────────────────────────────
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId.toString());
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  CHAT MESSAGING
  // ═══════════════════════════════════════════════════════════════════════

  socket.on('send_message', async (data) => {
    try {
      // If message object was already saved via REST, just relay to receiver to prevent duplicate DB records
      if (data.message && data.receiverId) {
        io.to(data.receiverId.toString()).emit('receive_message', data.message);
        return;
      }

      const { senderId, receiverId, content, bookingId } = data;
      if (!senderId || !receiverId || !content) return;

      const message = new Message({
        senderId,
        receiverId,
        content: content.trim(),
        bookingId: bookingId || null,
      });

      await message.save();
      await message.populate('senderId', 'name avatarUrl');
      await message.populate('receiverId', 'name avatarUrl');

      io.to(receiverId.toString()).emit('receive_message', message);
      socket.emit('message_sent', message);
    } catch (err) {
      console.error('Socket send_message error:', err);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    if (receiverId) {
      io.to(receiverId.toString()).emit('user_typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    if (receiverId) {
      io.to(receiverId.toString()).emit('user_stop_typing', { senderId });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  WEBRTC VIDEO CALL SIGNALING
  // ═══════════════════════════════════════════════════════════════════════

  socket.on('call_user', ({ from, to, fromName, bookingId }) => {
    console.log(`[Video] ${from} is calling ${to} for booking ${bookingId}`);
    if (to) {
      io.to(to.toString()).emit('incoming_call', { from, fromName, bookingId });
    }
  });

  socket.on('accept_call', ({ from, to }) => {
    console.log(`[Video] ${to} accepted call from ${from}`);
    if (from) {
      io.to(from.toString()).emit('call_accepted', { from: to });
    }
  });

  socket.on('reject_call', ({ from, to }) => {
    console.log(`[Video] ${to} rejected call from ${from}`);
    if (from) {
      io.to(from.toString()).emit('call_rejected', { from: to });
    }
  });

  socket.on('webrtc_signal', ({ to, signal }) => {
    if (to) {
      io.to(to.toString()).emit('webrtc_signal', { from: socket.userId || socket.id, signal });
    }
  });

  socket.on('end_call', ({ to }) => {
    if (to) {
      io.to(to.toString()).emit('call_ended');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
};
