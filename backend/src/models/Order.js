const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: String,
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
  },
  unit: String,
});

const orderSchema = new mongoose.Schema(
  {
    // Shopkeeper who placed the order
    shopkeeper: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    shopkeeperName: String,

    // Wholesaler who will fulfill
    wholesaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    wholesalerName: String,

    items: [orderItemSchema],

    totalAmount: {
      type: Number,
      required: true,
    },

    // Order status flow: Pending -> Accepted -> Dispatched -> Delivered  (or Rejected)
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Dispatched', 'Delivered'],
      default: 'Pending',
    },

    deliveryAddress: {
      type: String,
      required: true,
    },

    note: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
