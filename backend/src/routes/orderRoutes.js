const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, User } = require('../models');
const { protect, shopkeeperOnly, wholesalerOnly } = require('../middleware/authMiddleware');
const sequelize = require('../config/db');

// @route   POST /api/orders
// @desc    Shopkeeper places a new order
// @access  Private - Shopkeeper only
router.post('/', protect, shopkeeperOnly, async (req, res) => {
  const { items, wholesalerId, deliveryAddress, note } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must have at least one item' });
  }
  if (!wholesalerId || !deliveryAddress) {
    return res.status(400).json({ message: 'Wholesaler and delivery address are required' });
  }

  const t = await sequelize.transaction();
  try {
    let totalAmount = 0;
    const orderItemsData = [];

    for (const item of items) {
      const product = await Product.findByPk(item.productId, { transaction: t });
      if (!product) {
        await t.rollback();
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }
      if (product.stock < item.quantity) {
        await t.rollback();
        return res.status(400).json({ message: `Insufficient stock for: ${product.name}` });
      }

      orderItemsData.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        unit: product.unit,
      });

      totalAmount += Number(product.price) * item.quantity;
    }

    const wholesaler = await User.findByPk(wholesalerId, { transaction: t });
    if (!wholesaler) {
      await t.rollback();
      return res.status(404).json({ message: 'Wholesaler not found' });
    }

    const order = await Order.create(
      {
        shopkeeperId: req.user.id,
        shopkeeperName: req.user.name,
        wholesalerId,
        wholesalerName: wholesaler.name,
        totalAmount,
        deliveryAddress,
        note: note || '',
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      orderItemsData.map((item) => ({ ...item, orderId: order.id })),
      { transaction: t }
    );

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }] });
    res.status(201).json(fullOrder);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error placing order' });
  }
});

// @route   GET /api/orders/my
// @desc    Get orders for the logged-in user
// @access  Private
router.get('/my', protect, async (req, res) => {
  try {
    const where =
      req.user.type === 'shopkeeper' ? { shopkeeperId: req.user.id } : { wholesalerId: req.user.id };

    const orders = await Order.findAll({
      where,
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'DESC']],
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Wholesaler updates order status (Accept, Reject, Dispatch, Deliver)
// @access  Private - Wholesaler only
router.put('/:id/status', protect, wholesalerOnly, async (req, res) => {
  const { status } = req.body;
  const allowedStatuses = ['Accepted', 'Rejected', 'Dispatched', 'Delivered'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    if (order.wholesalerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this order' });
    }

    order.status = status;
    await order.save();
    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// @route   GET /api/orders/:id
// @desc    Get single order details
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ message: 'Order not found' });

    const isInvolved = order.shopkeeperId === req.user.id || order.wholesalerId === req.user.id;
    if (!isInvolved) return res.status(403).json({ message: 'Not authorized to view this order' });

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching order' });
  }
});

module.exports = router;
