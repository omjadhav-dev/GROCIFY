const { Notification } = require('../models');
const { emitToUser } = require('../socket');

// Creates a notification row and, if the user is currently online, pushes it
// to them immediately over Socket.IO. Call this instead of writing to the
// Notification model directly, so both things always stay in sync.
async function notifyUser(userId, { type, title, message, orderId = null }) {
  const notification = await Notification.create({ userId, type, title, message, orderId });
  emitToUser(userId, 'notification', notification);
  return notification;
}

module.exports = { notifyUser };
