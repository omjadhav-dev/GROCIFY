const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Message = sequelize.define(
  'Message',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    senderId: { type: DataTypes.INTEGER, allowNull: false },
    receiverId: { type: DataTypes.INTEGER, allowNull: false },
    // sorted combo of both user IDs, so A-B and B-A give the same conversation
    conversationId: { type: DataTypes.STRING, allowNull: false },
    text: { type: DataTypes.TEXT, allowNull: false },
    read: { type: DataTypes.BOOLEAN, defaultValue: false },
  },
  { tableName: 'messages' }
);

module.exports = Message;
