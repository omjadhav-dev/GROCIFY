const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    stock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    unit: {
      type: String,
      // e.g. kg, litre, dozen, piece
      default: 'piece',
    },
    category: {
      type: String,
      default: 'General',
    },
    image: {
      type: String,
      default: '',
    },
    // The wholesaler who listed this product
    wholesaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wholesalerName: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
