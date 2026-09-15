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
// catalog) that a product's — or a specific variant's — stock changed, so
// lists update live without a page refresh.
// `entry`: { productId, variantId (null for a non-variant product), stock, wholesalerId }
function broadcastStockUpdate(entry) {
  broadcast('product_stock_updated', {
    productId: entry.productId,
    variantId: entry.variantId ?? null,
    stock: entry.stock,
    wholesalerId: entry.wholesalerId,
  });
}

// Checks stock after a change and, if it crossed into "out of stock" or
// "low stock", alerts the wholesaler. Call this right after any save that
// changes stock — for a product or one of its variants.
// `entry`: { wholesalerId, stock, lowStockThreshold, displayName, unit }
async function checkStockAndAlertWholesaler(entry) {
  if (entry.stock === 0) {
    await notifyUser(entry.wholesalerId, {
      type: 'stock_out',
      title: 'Out of stock',
      message: `${entry.displayName} is now out of stock.`,
    });
  } else if (entry.stock <= entry.lowStockThreshold) {
    await notifyUser(entry.wholesalerId, {
      type: 'stock_low',
      title: 'Running low on stock',
      message: `${entry.displayName} has only ${entry.stock} ${entry.unit}(s) left.`,
    });
  }
}

module.exports = { notifyUser, broadcastStockUpdate, checkStockAndAlertWholesaler };
