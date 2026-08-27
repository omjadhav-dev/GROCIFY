const { Notification } = require('../models');
const { emitToUser, broadcast } = require('../socket');

// Creates a notification row and, if the user is currently online, pushes it
// to them immediately over Socket.IO. Call this instead of writing to the
// Notification model directly, so both things always stay in sync.
async function notifyUser(userId, { type, title, message, orderId = null }) {
  const notification = await Notification.create({ userId, type, title, message, orderId });
  emitToUser(userId, 'notification', notification);
  return notification;
}

// Tells every connected client (any shopkeeper currently browsing the
// catalog) that a product's stock changed, so lists update live without a
// page refresh. `product` is the up-to-date Sequelize instance.
function broadcastStockUpdate(product) {
  broadcast('product_stock_updated', {
    productId: product.id,
    stock: product.stock,
    wholesalerId: product.wholesalerId,
  });
}

// Checks a product's stock after a change and, if it crossed into "out of
// stock" or "low stock", alerts the wholesaler. Call this right after any
// save that changes `stock`.
async function checkStockAndAlertWholesaler(product) {
  if (product.stock === 0) {
    await notifyUser(product.wholesalerId, {
      type: 'stock_out',
      title: 'Out of stock',
      message: `${product.name} is now out of stock.`,
    });
  } else if (product.stock <= product.lowStockThreshold) {
    await notifyUser(product.wholesalerId, {
      type: 'stock_low',
      title: 'Running low on stock',
      message: `${product.name} has only ${product.stock} ${product.unit}(s) left.`,
    });
  }
}

module.exports = { notifyUser, broadcastStockUpdate, checkStockAndAlertWholesaler };
