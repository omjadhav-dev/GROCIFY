const express = require('express');
const router = express.Router();
const { Notification } = require('../models');
const { protect } = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get the logged-in user's notifications, most recent first
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50,
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get just the unread count (cheap to poll if needed)
// @access  Private
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Notification.count({ where: { userId: req.user.id, read: false } });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read
// @access  Private
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findByPk(req.params.id);
    if (!notification || notification.userId !== req.user.id) {
      return res.status(404).json({ message: 'Notification not found' });
    }
    notification.read = true;
    await notification.save();
    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: 'Error updating notification' });
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all of the logged-in user's notifications as read
// @access  Private
router.put('/read-all', protect, async (req, res) => {
  try {
    await Notification.update({ read: true }, { where: { userId: req.user.id, read: false } });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating notifications' });
  }
});

module.exports = router;
