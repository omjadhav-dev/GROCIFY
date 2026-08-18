const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { User } = require('../models');
const validate = require('../middleware/validate');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });

// @route   POST /api/auth/register
// @desc    Register a new user (shopkeeper or wholesaler)
// @access  Public
router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('mobile').trim().notEmpty().withMessage('Mobile number is required'),
    body('address').trim().notEmpty().withMessage('Address is required'),
    body('type').isIn(['shopkeeper', 'wholesaler']).withMessage('Invalid account type'),
    body('businessName').optional({ checkFalsy: true }).trim(),
  ],
  validate,
  async (req, res) => {
    const { name, email, password, mobile, address, type, businessName } = req.body;
    try {
      const existingUser = await User.findOne({ where: { email: email.toLowerCase() } });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      const user = await User.create({ name, email, password, mobile, address, type, businessName });

      res.status(201).json({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        type: user.type,
        businessName: user.businessName,
        token: generateToken(user.id),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during registration' });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user (both shopkeeper and wholesaler use same endpoint)
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('type').isIn(['shopkeeper', 'wholesaler']).withMessage('Account type is required'),
  ],
  validate,
  async (req, res) => {
    const { email, password, type } = req.body;
    try {
      const user = await User.findOne({ where: { email: email.toLowerCase() } });
      if (!user) return res.status(401).json({ message: 'Invalid email or password' });

      if (user.type !== type) {
        return res
          .status(401)
          .json({ message: `This email is registered as a ${user.type}. Please use the correct portal.` });
      }

      const isMatch = await user.matchPassword(password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        address: user.address,
        type: user.type,
        businessName: user.businessName,
        profileImage: user.profileImage,
        token: generateToken(user.id),
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error during login' });
    }
  }
);

module.exports = router;
