const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// A single pack size of a product, e.g. Product "Basmati Rice" might have
// variants "500g", "1kg", "5kg" — each with its own price, stock, and
// minimum order quantity, instead of needing a separate Product per size.
const ProductVariant = sequelize.define(
  'ProductVariant',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    productId: { type: DataTypes.INTEGER, allowNull: false },
    label: { type: DataTypes.STRING, allowNull: false }, // e.g. "500g", "1kg"
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, validate: { min: 0 } },
    minOrderQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
  },
  { tableName: 'product_variants' }
);

module.exports = ProductVariant;
