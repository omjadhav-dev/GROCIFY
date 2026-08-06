const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Normalized replacement for Mongo's embedded order-items array
const OrderItem = sequelize.define(
  'OrderItem',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    productName: { type: DataTypes.STRING },
    quantity: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1 } },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    unit: { type: DataTypes.STRING },
  },
  { tableName: 'order_items', timestamps: false }
);

module.exports = OrderItem;
