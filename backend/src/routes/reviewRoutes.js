const express = require('express');
const router = express.Router();
const { Review, Order } = require('../models');
const { protect, shopkeeperOnly } = require('../middleware/authMiddleware');
const sequelize = require('../config/db');

// @route   POST /api/reviews
// @desc    Shopkeeper rates the wholesaler for a delivered order (one review
//          per order)
// @access  Private - Shopkeeper only
router.post('/', protect, shopkeeperOnly, async (req, res) => {
  const { orderId, rating, comment } = req.body;
  const ratingNum = Number(rating);

  if (!orderId || !Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ message: 'A valid orderId and a rating from 1 to 5 are required' });
  }

  try {
    const order = await Order.findByPk(orderId);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    if (order.shopkeeperId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to review this order' });
    }
    if (order.status !== 'Delivered') {
      return res.status(400).json({ message: 'Only delivered orders can be reviewed' });
    }

    const existing = await Review.findOne({ where: { orderId } });
    if (existing) {
      return res.status(400).json({ message: 'This order has already been reviewed' });
    }

    const review = await Review.create({
      orderId,
      wholesalerId: order.wholesalerId,
      shopkeeperId: req.user.id,
      shopkeeperName: req.user.name,
      rating: ratingNum,
      comment: comment || '',
    });

    res.status(201).json(review);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error submitting review' });
  }
});

// @route   GET /api/reviews/wholesaler/:id
// @desc    Get a wholesaler's average rating and review list
// @access  Private
router.get('/wholesaler/:id', protect, async (req, res) => {
  try {
    const wholesalerId = req.params.id;
    const reviews = await Review.findAll({ where: { wholesalerId }, order: [['createdAt', 'DESC']] });

    const [agg] = await Review.findAll({
      where: { wholesalerId },
      attributes: [
        [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
      ],
      raw: true,
    });

    res.json({
      averageRating: agg.averageRating ? Number(agg.averageRating) : null,
      reviewCount: Number(agg.reviewCount) || 0,
      reviews,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching reviews' });
  }
});

// @route   GET /api/reviews/order/:orderId
// @desc    Check whether a specific order already has a review (so the UI
//          knows whether to show the rating form)
// @access  Private
router.get('/order/:orderId', protect, async (req, res) => {
  try {
    const review = await Review.findOne({ where: { orderId: req.params.orderId } });
    res.json(review);
  } catch (error) {
    res.status(500).json({ message: 'Error checking review status' });
  }
});

module.exports = router;
