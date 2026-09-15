const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Product = sequelize.define(
  'Product',
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false },
    description: { type: DataTypes.TEXT, defaultValue: '' },
    price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, validate: { min: 0 } },
    lowStockThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5, validate: { min: 0 } },
    minOrderQty: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
    unit: { type: DataTypes.STRING, defaultValue: 'piece' },
    packSize: { type: DataTypes.STRING, defaultValue: '' }, // actual quantity, e.g. "100gm", "1kg", "1packet"
    category: { type: DataTypes.STRING, defaultValue: 'General' },
    image: { type: DataTypes.STRING, defaultValue: '' },
    wholesalerId: { type: DataTypes.INTEGER, allowNull: false },
    wholesalerName: { type: DataTypes.STRING },
  },
  { tableName: 'products' }
);

module.exports = Product;
