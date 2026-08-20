const sequelize = require('../config/db');
const User = require('./User');
const Product = require('./Product');
const Order = require('./Order');
const OrderItem = require('./OrderItem');
const Message = require('./Message');
const Notification = require('./Notification');

// ---- Associations ----

// Product belongs to a wholesaler (User)
Product.belongsTo(User, { as: 'wholesaler', foreignKey: 'wholesalerId' });
User.hasMany(Product, { as: 'products', foreignKey: 'wholesalerId' });

// Order belongs to a shopkeeper and a wholesaler (both Users)
Order.belongsTo(User, { as: 'shopkeeper', foreignKey: 'shopkeeperId' });
Order.belongsTo(User, { as: 'wholesaler', foreignKey: 'wholesalerId' });

// Order has many OrderItems
Order.hasMany(OrderItem, { as: 'items', foreignKey: 'orderId' });
OrderItem.belongsTo(Order, { foreignKey: 'orderId' });
OrderItem.belongsTo(Product, { foreignKey: 'productId' });

// Message belongs to sender and receiver (both Users)
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });
Message.belongsTo(User, { as: 'receiver', foreignKey: 'receiverId' });

// Notification belongs to the user it's for
Notification.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Notification, { foreignKey: 'userId' });

module.exports = { sequelize, User, Product, Order, OrderItem, Message, Notification };
