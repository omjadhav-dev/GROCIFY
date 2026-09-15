const express = require('express');
const router = express.Router();
const { Order, OrderItem, Product, ProductVariant, User } = require('../models');
const { protect, shopkeeperOnly, wholesalerOnly } = require('../middleware/authMiddleware');
const sequelize = require('../config/db');
const { notifyUser, broadcastStockUpdate, checkStockAndAlertWholesaler } = require('../utils/notify');

// Marks an error as a client-facing validation failure (bad stock, min qty,
// missing product/variant) so route handlers can return 400 with its
// message, instead of guessing based on message text.
class OrderValidationError extends Error {}

// Row-locks and validates+reserves stock for one order line item, handling
// both plain products and a specific variant of a product. Throws an Error
// with a user-facing `.message` on any validation failure — callers should
// catch it, roll back, and return that message as the 400 response.
async function reserveItemStock(item, t) {
  const product = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
  if (!product) throw new OrderValidationError(`Product not found: ${item.productId}`);

  let stockHolder = product; // the row whose `.stock` we actually decrement
  let minOrderQty = product.minOrderQty;
  let unitPrice = product.price;
  let displayName = product.name;
  let variantLabel = null;

  if (item.variantId) {
    const variant = await ProductVariant.findByPk(item.variantId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!variant || variant.productId !== product.id) {
      throw new OrderValidationError(`Variant not found for product: ${product.name}`);
    }
    stockHolder = variant;
    minOrderQty = variant.minOrderQty;
    unitPrice = variant.price;
    variantLabel = variant.label;
    displayName = `${product.name} (${variant.label})`;
  }

  if (item.quantity < minOrderQty) {
    throw new OrderValidationError(`Minimum order quantity for ${displayName} is ${minOrderQty} ${product.unit}(s)`);
  }
  if (stockHolder.stock < item.quantity) {
    throw new OrderValidationError(`Insufficient stock for: ${displayName}`);
  }

  stockHolder.stock -= item.quantity;
  await stockHolder.save({ transaction: t });

  return {
    orderItemData: {
      productId: product.id,
      productName: product.name,
      variantId: item.variantId || null,
      variantLabel,
      quantity: item.quantity,
      price: unitPrice,
      unit: product.unit,
    },
    stockEntry: {
      productId: product.id,
      variantId: item.variantId || null,
      stock: stockHolder.stock,
      wholesalerId: product.wholesalerId,
      lowStockThreshold: stockHolder.lowStockThreshold,
      displayName,
      unit: product.unit,
    },
  };
}

// Reverses a reservation (order rejected, item edited away, etc.) by adding
// the quantity back to whichever row (product or variant) it came from.
async function releaseItemStock(item, t) {
  let stockHolder;
  let wholesalerId;
  let lowStockThreshold;
  let unit;
  let displayName;

  if (item.variantId) {
    stockHolder = await ProductVariant.findByPk(item.variantId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!stockHolder) return null;
    const product = await Product.findByPk(item.productId, { transaction: t });
    wholesalerId = product?.wholesalerId;
    unit = product?.unit;
    displayName = product ? `${product.name} (${stockHolder.label})` : item.variantLabel;
  } else {
    stockHolder = await Product.findByPk(item.productId, { transaction: t, lock: t.LOCK.UPDATE });
    if (!stockHolder) return null;
    wholesalerId = stockHolder.wholesalerId;
    unit = stockHolder.unit;
    displayName = stockHolder.name;
  }

  lowStockThreshold = stockHolder.lowStockThreshold;
  stockHolder.stock += item.quantity;
  await stockHolder.save({ transaction: t });

  return {
    productId: item.productId,
    variantId: item.variantId || null,
    stock: stockHolder.stock,
    wholesalerId,
    lowStockThreshold,
    displayName,
    unit,
  };
}

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
    const stockEntries = [];

    for (const item of items) {
      const { orderItemData, stockEntry } = await reserveItemStock(item, t);
      orderItemsData.push(orderItemData);
      stockEntries.push(stockEntry);
      totalAmount += Number(orderItemData.price) * orderItemData.quantity;
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

    // Let the wholesaler know a new order has come in
    await notifyUser(wholesalerId, {
      type: 'order_placed',
      title: 'New order received',
      message: `${req.user.name} placed an order worth ₹${totalAmount.toFixed(0)}`,
      orderId: order.id,
    });

    // Push the new stock levels to everyone browsing, and alert the
    // wholesaler if any item just went low/out of stock.
    for (const entry of stockEntries) {
      broadcastStockUpdate(entry);
      await checkStockAndAlertWholesaler(entry);
    }

    res.status(201).json(fullOrder);
  } catch (error) {
    await t.rollback();
    if (error instanceof OrderValidationError) {
      return res.status(400).json({ message: error.message });
    }
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

// @route   PUT /api/orders/:id/items
// @desc    Shopkeeper edits item quantities on their own order, while it's
//          still Pending — avoids needing to cancel and re-place from
//          scratch. Releases the old stock reservation and re-reserves
//          against the new quantities in one transaction.
// @access  Private - Shopkeeper only
router.put('/:id/items', protect, shopkeeperOnly, async (req, res) => {
  const { items } = req.body;
  if (!items || items.length === 0) {
    return res.status(400).json({ message: 'Order must have at least one item' });
  }

  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }], transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.shopkeeperId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ message: 'Not authorized to edit this order' });
    }
    if (order.status !== 'Pending') {
      await t.rollback();
      return res.status(400).json({ message: 'Only pending orders can be edited' });
    }

    const stockEntries = [];

    // Release everything the original order had reserved...
    for (const item of order.items) {
      const entry = await releaseItemStock(item, t);
      if (entry) stockEntries.push(entry);
    }
    await OrderItem.destroy({ where: { orderId: order.id }, transaction: t });

    // ...then re-reserve against the new quantities.
    let totalAmount = 0;
    const orderItemsData = [];
    for (const item of items) {
      const { orderItemData, stockEntry } = await reserveItemStock(item, t);
      orderItemsData.push(orderItemData);
      stockEntries.push(stockEntry);
      totalAmount += Number(orderItemData.price) * orderItemData.quantity;
    }

    await OrderItem.bulkCreate(
      orderItemsData.map((item) => ({ ...item, orderId: order.id })),
      { transaction: t }
    );

    order.totalAmount = totalAmount;
    await order.save({ transaction: t });

    await t.commit();

    const fullOrder = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }] });

    for (const entry of stockEntries) {
      broadcastStockUpdate(entry);
      await checkStockAndAlertWholesaler(entry);
    }

    await notifyUser(order.wholesalerId, {
      type: 'order_edited',
      title: `Order #${String(order.id).padStart(6, '0')} updated`,
      message: `${req.user.name} changed the items on their order.`,
      orderId: order.id,
    });

    res.json(fullOrder);
  } catch (error) {
    await t.rollback();
    if (error instanceof OrderValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error(error);
    res.status(500).json({ message: 'Error updating order items' });
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

    // Stock was reserved when the order was placed. If it's rejected, that
    // stock never actually left the warehouse, so give it back.
    if (status === 'Rejected') {
      const t2 = await sequelize.transaction();
      try {
        for (const item of order.items) {
          const entry = await releaseItemStock(item, t2);
          if (entry) broadcastStockUpdate(entry);
        }
        await t2.commit();
      } catch (e) {
        await t2.rollback();
        throw e;
      }
    }

    // Let the shopkeeper know their order status changed
    await notifyUser(order.shopkeeperId, {
      type: 'order_status',
      title: `Order #${String(order.id).padStart(6, '0')} ${status.toLowerCase()}`,
      message: `Your order to ${order.wholesalerName} is now "${status}".`,
      orderId: order.id,
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating order status' });
  }
});

// @route   PUT /api/orders/:id/dispute
// @desc    Shopkeeper reports an issue with a Delivered order (wrong item,
//          damaged goods, etc.)
// @access  Private - Shopkeeper only
router.put('/:id/dispute', protect, shopkeeperOnly, async (req, res) => {
  const { reason } = req.body;
  if (!reason || !reason.trim()) {
    return res.status(400).json({ message: 'A reason is required to report an issue' });
  }

  try {
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.shopkeeperId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to dispute this order' });
    }
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be disputed' });
    }

    order.status = 'Disputed';
    order.disputeReason = reason.trim();
    await order.save();

    await notifyUser(order.wholesalerId, {
      type: 'order_disputed',
      title: `Order #${String(order.id).padStart(6, '0')} disputed`,
      message: `${req.user.name} reported an issue: "${reason.trim()}"`,
      orderId: order.id,
    });

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error reporting order issue' });
  }
});

// @route   PUT /api/orders/:id/resolve-dispute
// @desc    Wholesaler resolves a disputed order — accepts the return
//          (restoring stock) or dismisses it back to Delivered.
// @access  Private - Wholesaler only
router.put('/:id/resolve-dispute', protect, wholesalerOnly, async (req, res) => {
  const { resolution } = req.body; // 'Returned' | 'Delivered'
  if (!['Returned', 'Delivered'].includes(resolution)) {
    return res.status(400).json({ message: 'Invalid resolution value' });
  }

  const t = await sequelize.transaction();
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }], transaction: t });
    if (!order) {
      await t.rollback();
      return res.status(404).json({ message: 'Order not found' });
    }
    if (order.wholesalerId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ message: 'Not authorized to resolve this dispute' });
    }
    if (order.status !== 'Disputed') {
      await t.rollback();
      return res.status(400).json({ message: 'Only disputed orders can be resolved' });
    }

    const stockEntries = [];
    if (resolution === 'Returned') {
      // Goods are coming back — restock them.
      for (const item of order.items) {
        const entry = await releaseItemStock(item, t);
        if (entry) stockEntries.push(entry);
      }
    }

    order.status = resolution;
    await order.save({ transaction: t });
    await t.commit();

    for (const entry of stockEntries) broadcastStockUpdate(entry);

    await notifyUser(order.shopkeeperId, {
      type: 'order_status',
      title: `Order #${String(order.id).padStart(6, '0')} dispute resolved`,
      message:
        resolution === 'Returned'
          ? `${order.wholesalerName} accepted your return.`
          : `${order.wholesalerName} reviewed your report — order remains marked Delivered.`,
      orderId: order.id,
    });

    res.json(order);
  } catch (error) {
    await t.rollback();
    console.error(error);
    res.status(500).json({ message: 'Error resolving dispute' });
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
