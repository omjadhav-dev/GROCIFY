const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Order = sequelize.define(
  'Order',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    shopkeeperId: { type: DataTypes.INTEGER, allowNull: false },
    shopkeeperName: { type: DataTypes.STRING },
    wholesalerId: { type: DataTypes.INTEGER, allowNull: false },
    wholesalerName: { type: DataTypes.STRING },
    totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    // Order status flow: Pending -> Accepted -> Dispatched -> Delivered (or Rejected)
    status: {
      type: DataTypes.ENUM('Pending', 'Accepted', 'Rejected', 'Dispatched', 'Delivered'),
      defaultValue: 'Pending',
    },
    deliveryAddress: { type: DataTypes.STRING, allowNull: false },
    note: { type: DataTypes.STRING, defaultValue: '' },
  },
  { tableName: 'orders' }
);

module.exports = Order;
