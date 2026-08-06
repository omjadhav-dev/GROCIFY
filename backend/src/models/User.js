const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../config/db');

const User = sequelize.define(
  'User',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true },
      set(value) {
        this.setDataValue('email', value.toLowerCase().trim());
      },
    },
    password: { type: DataTypes.STRING, allowNull: false, validate: { len: [6, 200] } },
    mobile: { type: DataTypes.STRING, allowNull: false },
    address: { type: DataTypes.STRING, allowNull: false },
    // 'shopkeeper' or 'wholesaler'
    type: { type: DataTypes.ENUM('shopkeeper', 'wholesaler'), allowNull: false },
    profileImage: { type: DataTypes.STRING, defaultValue: '' },
    businessName: { type: DataTypes.STRING, defaultValue: '' },
  },
  {
    tableName: 'users',
    hooks: {
      // Hash password whenever it's created or changed
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Instance method to compare passwords during login
User.prototype.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = User;
