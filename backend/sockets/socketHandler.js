// Socket.IO event handler for Dokkhota real-time features
// Supports: Chat messaging, Typing indicators, WebRTC video call signaling
const Message = require('../models/Message');

module.exports = (io, socket) => {
  // ── Join personal room by userId ──────────────────────────────────────
  socket.on('join', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`Socket ${socket.id} joined user room: ${userId}`);
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  CHAT MESSAGING
  // ═══════════════════════════════════════════════════════════════════════

  socket.on('send_message', async (data) => {
    try {
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

      io.to(receiverId).emit('receive_message', message);
      socket.emit('message_sent', message);
    } catch (err) {
      console.error('Socket send_message error:', err);
      socket.emit('message_error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', ({ senderId, receiverId }) => {
    io.to(receiverId).emit('user_typing', { senderId });
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    io.to(receiverId).emit('user_stop_typing', { senderId });
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  WEBRTC VIDEO CALL SIGNALING
  // ═══════════════════════════════════════════════════════════════════════

  // Step 1: Caller sends an invitation to start a video session
  socket.on('call_user', ({ from, to, fromName, bookingId }) => {
    console.log(`[Video] ${from} is calling ${to} for booking ${bookingId}`);
    io.to(to).emit('incoming_call', { from, fromName, bookingId });
  });

  // Step 2: Callee accepts the call
  socket.on('accept_call', ({ from, to }) => {
    console.log(`[Video] ${to} accepted call from ${from}`);
    io.to(from).emit('call_accepted', { from: to });
  });

  // Step 3: Callee rejects the call
  socket.on('reject_call', ({ from, to }) => {
    console.log(`[Video] ${to} rejected call from ${from}`);
    io.to(from).emit('call_rejected', { from: to });
  });

  // Step 4: WebRTC signaling — relay the offer/answer SDP
  socket.on('webrtc_signal', ({ to, signal }) => {
    io.to(to).emit('webrtc_signal', { from: socket.userId || socket.id, signal });
  });

  // Step 5: Either party ends the call
  socket.on('end_call', ({ to }) => {
    io.to(to).emit('call_ended');
  });

  // ═══════════════════════════════════════════════════════════════════════

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
};
