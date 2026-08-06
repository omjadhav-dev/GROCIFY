const jwt = require('jsonwebtoken');
const { User } = require('../models');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] },
      });

      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user no longer exists' });
      }

      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, invalid token' });
    }
  }

  return res.status(401).json({ message: 'Not authorized, no token provided' });
};

const wholesalerOnly = (req, res, next) => {
  if (req.user && req.user.type === 'wholesaler') return next();
  return res.status(403).json({ message: 'Access denied. Wholesalers only.' });
};

const shopkeeperOnly = (req, res, next) => {
  if (req.user && req.user.type === 'shopkeeper') return next();
  return res.status(403).json({ message: 'Access denied. Shopkeepers only.' });
};

module.exports = { protect, wholesalerOnly, shopkeeperOnly };
