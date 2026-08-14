const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Message, User } = require('../models');
const { protect } = require('../middleware/authMiddleware');

// Helper: create a consistent conversationId from two user IDs
const getConversationId = (id1, id2) => [id1, id2].sort((a, b) => a - b).join('_');

// @route   POST /api/chat/send
// @desc    Send a message to another user
// @access  Private
router.post('/send', protect, async (req, res) => {
  const { receiverId, text } = req.body;
  if (!receiverId || !text) {
    return res.status(400).json({ message: 'Receiver and message text are required' });
  }

  try {
    const conversationId = getConversationId(req.user.id, Number(receiverId));
    const message = await Message.create({
      senderId: req.user.id,
      receiverId,
      conversationId,
      text,
    });
    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: 'Error sending message' });
  }
});

// @route   GET /api/chat/:userId
// @desc    Get all messages between logged-in user and another user
// @access  Private
router.get('/:userId', protect, async (req, res) => {
  try {
    const conversationId = getConversationId(req.user.id, Number(req.params.userId));

    const messages = await Message.findAll({
      where: { conversationId },
      order: [['createdAt', 'ASC']],
    });

    await Message.update(
      { read: true },
      { where: { conversationId, receiverId: req.user.id, read: false } }
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching messages' });
  }
});

// @route   GET /api/chat/contacts/list
// @desc    Get list of users the logged-in user has chatted with (for sidebar)
// @access  Private
router.get('/contacts/list', protect, async (req, res) => {
  try {
    const messages = await Message.findAll({
      where: { [Op.or]: [{ senderId: req.user.id }, { receiverId: req.user.id }] },
      order: [['createdAt', 'DESC']],
    });

    const contactIds = new Set();
    messages.forEach((msg) => {
      const otherId = msg.senderId === req.user.id ? msg.receiverId : msg.senderId;
      contactIds.add(otherId);
    });

    const contacts = await User.findAll({
      where: { id: { [Op.in]: [...contactIds] } },
      attributes: ['id', 'name', 'email', 'type'],
    });

    const contactsWithInfo = await Promise.all(
      contacts.map(async (contact) => {
        const conversationId = getConversationId(req.user.id, contact.id);
        const lastMsg = await Message.findOne({
          where: { conversationId },
          order: [['createdAt', 'DESC']],
        });
        const unreadCount = await Message.count({
          where: { conversationId, receiverId: req.user.id, read: false },
        });

        return {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          type: contact.type,
          lastMessage: lastMsg ? lastMsg.text : '',
          lastMessageTime: lastMsg ? lastMsg.createdAt : null,
          unreadCount,
        };
      })
    );

    res.json(contactsWithInfo);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching contacts' });
  }
});

// @route   GET /api/chat/users/browse
// @desc    Shopkeepers can browse wholesalers to start a chat (and vice versa)
// @access  Private
router.get('/users/browse', protect, async (req, res) => {
  try {
    const oppositeType = req.user.type === 'shopkeeper' ? 'wholesaler' : 'shopkeeper';
    const users = await User.findAll({
      where: { type: oppositeType },
      attributes: ['id', 'name', 'email', 'mobile', 'address', 'type'],
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

module.exports = router;
