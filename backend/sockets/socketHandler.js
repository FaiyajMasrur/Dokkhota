const Message = require('../models/Message');
const { createNotification } = require('../utils/notificationHelper');

// Track ongoing session call states: bookingId -> { from, to, fromName, bookingId, startedAt }
const activeCalls = new Map();

module.exports = (io, socket) => {
  // ── Join personal room by userId ──────────────────────────────────────
  socket.on('join', (userId) => {
    if (userId) {
      socket.userId = userId.toString();
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

  socket.on('message_reaction', ({ receiverId, messageId, reactions }) => {
    if (receiverId) {
      io.to(receiverId.toString()).emit('message_reaction', { messageId, reactions });
    }
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  WEBRTC VIDEO CALL SIGNALING
  // ═══════════════════════════════════════════════════════════════════════

  socket.on('call_user', async ({ from, to, fromName, bookingId }) => {
    console.log(`[Video] ${from} (${fromName}) is calling ${to} for booking ${bookingId}`);
    if (bookingId) {
      activeCalls.set(bookingId.toString(), {
        from,
        to,
        fromName,
        bookingId,
        startedAt: Date.now(),
      });
    }

    if (to) {
      io.to(to.toString()).emit('incoming_call', { from, fromName, bookingId });

      // Save notification in database with direct link for existing notification panel
      try {
        await createNotification({
          userId: to,
          title: 'Incoming Session Call 📞',
          message: `${fromName || 'Partner'} is calling you for your session. Click Join Call.`,
          type: 'call',
          link: `/session/${bookingId}`,
          bookingId: bookingId || null,
        });
      } catch (err) {
        console.error('Error saving call notification:', err.message);
      }
    }
  });

  // When B enters /session/:bookingId, check if A is currently calling
  socket.on('check_call_status', ({ bookingId }) => {
    if (bookingId && activeCalls.has(bookingId.toString())) {
      const call = activeCalls.get(bookingId.toString());
      // Check if the call was initiated within the last 10 minutes
      if (Date.now() - call.startedAt < 10 * 60 * 1000) {
        socket.emit('incoming_call', {
          from: call.from,
          fromName: call.fromName,
          bookingId: call.bookingId,
        });
      } else {
        activeCalls.delete(bookingId.toString());
      }
    }
  });

  socket.on('accept_call', ({ from, to, bookingId }) => {
    console.log(`[Video] ${to} accepted call from ${from}`);
    if (bookingId) {
      activeCalls.delete(bookingId.toString());
    }
    if (from) {
      io.to(from.toString()).emit('call_accepted', { from: to, bookingId });
    }
  });

  socket.on('reject_call', ({ from, to, bookingId }) => {
    console.log(`[Video] ${to} rejected call from ${from}`);
    if (bookingId) {
      activeCalls.delete(bookingId.toString());
    }
    if (from) {
      io.to(from.toString()).emit('call_rejected', { from: to, bookingId });
    }
  });

  socket.on('webrtc_signal', ({ to, signal }) => {
    if (to) {
      io.to(to.toString()).emit('webrtc_signal', { from: socket.userId || socket.id, signal });
    }
  });

  socket.on('end_call', ({ to, bookingId }) => {
    if (bookingId) {
      activeCalls.delete(bookingId.toString());
    }
    if (to) {
      io.to(to.toString()).emit('call_ended');
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
};
