// Message controller for Dokkhota real-time chat endpoints
const Message = require('../models/Message');
const User = require('../models/User');
const Booking = require('../models/Booking');

// ── Get list of all conversation partners for the current user ───────────
const getConversations = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;

    // 1. Get all user IDs from Bookings (matched users)
    const bookings = await Booking.find({
      $or: [{ teacherId: currentUserId }, { studentId: currentUserId }],
    });

    const partnerIds = new Set();
    bookings.forEach((b) => {
      const student = b.studentId.toString();
      const teacher = b.teacherId.toString();
      if (student !== currentUserId) partnerIds.add(student);
      if (teacher !== currentUserId) partnerIds.add(teacher);
    });

    // 2. Also get any users from existing Messages
    const recentMessages = await Message.find({
      $or: [{ senderId: currentUserId }, { receiverId: currentUserId }],
    }).sort({ createdAt: -1 });

    recentMessages.forEach((m) => {
      const sender = m.senderId.toString();
      const receiver = m.receiverId.toString();
      if (sender !== currentUserId) partnerIds.add(sender);
      if (receiver !== currentUserId) partnerIds.add(receiver);
    });

    // 3. For each partner, fetch user details + last message
    const partnerArray = Array.from(partnerIds);
    const conversations = await Promise.all(
      partnerArray.map(async (partnerId) => {
        const user = await User.findById(partnerId).select('name email avatarUrl bio');
        const lastMessage = await Message.findOne({
          $or: [
            { senderId: currentUserId, receiverId: partnerId },
            { senderId: partnerId, receiverId: currentUserId },
          ],
        }).sort({ createdAt: -1 });

        const unreadCount = await Message.countDocuments({
          senderId: partnerId,
          receiverId: currentUserId,
          isRead: false,
        });

        return {
          user,
          lastMessage: lastMessage ? lastMessage.content : '',
          lastMessageTime: lastMessage ? lastMessage.createdAt : null,
          unreadCount,
        };
      })
    );

    // Sort by most recent message
    conversations.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      return timeB - timeA;
    });

    return res.status(200).json({ success: true, conversations });
  } catch (error) {
    return next(error);
  }
};

// ── Get message history with a specific user ───────────────────────────
const getMessages = async (req, res, next) => {
  try {
    const currentUserId = req.user.id;
    const { partnerId } = req.params;

    // Fetch messages between current user and partner
    const messages = await Message.find({
      $or: [
        { senderId: currentUserId, receiverId: partnerId },
        { senderId: partnerId, receiverId: currentUserId },
      ],
    })
      .sort({ createdAt: 1 })
      .populate('senderId', 'name avatarUrl')
      .populate('receiverId', 'name avatarUrl');

    // Mark unread incoming messages as read
    await Message.updateMany(
      { senderId: partnerId, receiverId: currentUserId, isRead: false },
      { isRead: true }
    );

    const partnerUser = await User.findById(partnerId).select('name email avatarUrl bio');

    return res.status(200).json({
      success: true,
      partner: partnerUser,
      messages,
    });
  } catch (error) {
    return next(error);
  }
};

// ── Send a message via REST ────────────────────────────────────────────
const sendMessage = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content, bookingId } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: 'Receiver ID and content are required' });
    }

    const message = new Message({
      senderId,
      receiverId,
      content,
      bookingId: bookingId || null,
    });

    await message.save();
    await message.populate('senderId', 'name avatarUrl');
    await message.populate('receiverId', 'name avatarUrl');

    return res.status(201).json({ success: true, message });
  } catch (error) {
    return next(error);
  }
};

// ── Add/Toggle emoji reaction on a message ─────────────────────────────
const reactToMessage = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ success: false, message: 'Emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check if user is sender or receiver of this message
    const isParticipant =
      message.senderId.toString() === userId || message.receiverId.toString() === userId;
    if (!isParticipant) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Toggle reaction if exact same emoji by same user exists
    const existingIndex = (message.reactions || []).findIndex(
      (r) => r.userId.toString() === userId && r.emoji === emoji
    );

    if (existingIndex > -1) {
      message.reactions.splice(existingIndex, 1);
    } else {
      if (!message.reactions) message.reactions = [];
      message.reactions.push({ emoji, userId, createdAt: new Date() });
    }

    await message.save();
    await message.populate('senderId', 'name avatarUrl');
    await message.populate('receiverId', 'name avatarUrl');

    const io = req.app.get('io');
    if (io) {
      const otherUserId =
        message.senderId._id.toString() === userId
          ? message.receiverId._id.toString()
          : message.senderId._id.toString();
      io.to(otherUserId).emit('message_reaction', {
        messageId: message._id,
        reactions: message.reactions,
      });
    }

    return res.status(200).json({ success: true, message });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  reactToMessage,
};