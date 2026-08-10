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

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
};