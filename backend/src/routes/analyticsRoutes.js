const express = require('express');
const router = express.Router();
const { Order, OrderItem } = require('../models');
const { protect, wholesalerOnly } = require('../middleware/authMiddleware');

// @route   GET /api/analytics/wholesaler
// @desc    Sales analytics for the logged-in wholesaler: revenue summary,
//          order status breakdown, top-selling products, and a 14-day
//          revenue trend — everything the Analytics page needs in one call.
// @access  Private - Wholesaler only
router.get('/wholesaler', protect, wholesalerOnly, async (req, res) => {
  try {
    const wholesalerId = req.user.id;

    const orders = await Order.findAll({
      where: { wholesalerId },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['createdAt', 'ASC']],
    });

    const delivered = orders.filter((o) => o.status === 'Delivered');
    const totalRevenue = delivered.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const avgOrderValue = delivered.length ? totalRevenue / delivered.length : 0;

    // How many orders are sitting in each status right now
    const statusCounts = {};
    for (const order of orders) {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    }

    // "What's selling" — aggregate quantity/revenue per product across every
    // order that wasn't rejected (Rejected orders never actually shipped).
    const productMap = {};
    for (const order of orders) {
      if (order.status === 'Rejected') continue;
      for (const item of order.items) {
        if (!productMap[item.productId]) {
          productMap[item.productId] = {
            productId: item.productId,
            name: item.productName,
            quantity: 0,
            revenue: 0,
          };
        }
        productMap[item.productId].quantity += item.quantity;
        productMap[item.productId].revenue += Number(item.price) * item.quantity;
      }
    }
    const topProducts = Object.values(productMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8);

    // "When" — delivered revenue for each of the last 14 days
    const DAYS = 14;
    const salesByDay = [];
    const today = new Date();
    for (let i = DAYS - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      salesByDay.push({ date: d.toISOString().slice(0, 10), revenue: 0, orders: 0 });
    }
    const dayIndex = Object.fromEntries(salesByDay.map((d, idx) => [d.date, idx]));
    for (const order of delivered) {
      const dateStr = new Date(order.createdAt).toISOString().slice(0, 10);
      if (dayIndex[dateStr] !== undefined) {
        salesByDay[dayIndex[dateStr]].revenue += Number(order.totalAmount);
        salesByDay[dayIndex[dateStr]].orders += 1;
      }
    }

    res.json({
      summary: {
        totalRevenue,
        totalOrders: orders.length,
        deliveredOrders: delivered.length,
        avgOrderValue,
      },
      statusCounts,
      topProducts,
      salesByDay,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

module.exports = router;
