const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const ProductVariant = sequelize.define(
  'ProductVariant',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, validate: { min: 0 } },
    minOrderQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
    description: { type: DataTypes.STRING, allowNull: true, defaultValue: '' }, // pack quantity e.g. "100 gm"
  },
  { tableName: 'product_variants' }
);

module.exports = ProductVariant;