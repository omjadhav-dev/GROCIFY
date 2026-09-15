const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// One review per delivered order — a shopkeeper rating the wholesaler who
// fulfilled it. Ratings are aggregated per wholesaler and shown on the
// product catalog.
const Review = sequelize.define(
  'Review',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    orderId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    wholesalerId: { type: DataTypes.INTEGER, allowNull: false },
    shopkeeperId: { type: DataTypes.INTEGER, allowNull: false },
    shopkeeperName: { type: DataTypes.STRING },
    rating: { type: DataTypes.INTEGER, allowNull: false, validate: { min: 1, max: 5 } },
    comment: { type: DataTypes.STRING, defaultValue: '' },
  },
  { tableName: 'reviews' }
);

module.exports = Review;
