const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Notification = sequelize.define(
  'Notification',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    userId: { type: DataTypes.INTEGER, allowNull: false }, // who this notification is for
    orderId: { type: DataTypes.INTEGER, allowNull: true }, // related order, if any
    // 'order_placed' (-> wholesaler) | 'order_status' (-> shopkeeper)
    type: { type: DataTypes.STRING, allowNull: false },
    title: { type: DataTypes.STRING, allowNull: false },
    message: { type: DataTypes.STRING, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'notifications' }
);

module.exports = Notification;
