const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');
const { Product, User } = require('../models');
const { protect, wholesalerOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');

const deleteImageFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  const fullPath = path.join(__dirname, '..', imagePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('Failed to delete old image:', err.message);
  });
};

// @route   GET /api/products
// @desc    Get all products (shopkeepers browse these)
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const where = {};
    if (req.query.wholesaler) where.wholesalerId = req.query.wholesaler;
    if (req.query.category) where.category = req.query.category;

    const products = await Product.findAll({
      where,
      include: [{ model: User, as: 'wholesaler', attributes: ['id', 'name', 'email', 'mobile'] }],
      order: [['createdAt', 'DESC']],
    });
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// @route   GET /api/products/my
// @desc    Get products listed by the logged-in wholesaler
// @access  Private - Wholesaler only
router.get('/my', protect, wholesalerOnly, async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { wholesalerId: req.user.id },
      order: [['createdAt', 'DESC']],
    });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your products' });
  }
});

// @route   POST /api/products
// @desc    Add a new product (wholesaler only)
// @access  Private - Wholesaler only
router.post(
  '/',
  protect,
  wholesalerOnly,
  upload.single('image'),
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('stock').isInt({ min: 0 }).withMessage('Stock must be a non-negative number'),
  ],
  validate,
  async (req, res) => {
    const { name, description, price, stock, lowStockThreshold, unit, category } = req.body;
    try {
      const image = req.file ? `/uploads/${req.file.filename}` : '';

      const product = await Product.create({
        name,
        description,
        price,
        stock,
        lowStockThreshold: lowStockThreshold !== undefined && lowStockThreshold !== '' ? lowStockThreshold : 5,
        unit: unit || 'piece',
        category: category || 'General',
        image,
        wholesalerId: req.user.id,
        wholesalerName: req.user.name,
      });

      res.status(201).json(product);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error adding product' });
    }
  }
);

// @route   PUT /api/products/:id
// @desc    Update a product (wholesaler only, must own it)
// @access  Private - Wholesaler only
router.put('/:id', protect, wholesalerOnly, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.wholesalerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const { name, description, price, stock, lowStockThreshold, unit, category, removeImage } = req.body;

    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.lowStockThreshold = lowStockThreshold !== undefined ? lowStockThreshold : product.lowStockThreshold;
    product.unit = unit || product.unit;
    product.category = category || product.category;

    if (req.file) {
      deleteImageFile(product.image);
      product.image = `/uploads/${req.file.filename}`;
    } else if (removeImage === 'true') {
      deleteImageFile(product.image);
      product.image = '';
    }

    await product.save();
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (wholesaler only, must own it)
// @access  Private - Wholesaler only
router.delete('/:id', protect, wholesalerOnly, async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.wholesalerId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.destroy();
    deleteImageFile(product.image);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Handle multer errors (bad file type, too large, etc.) with a clean JSON response
router.use((err, req, res, next) => {
  if (err && err.message) return res.status(400).json({ message: err.message });
  next(err);
});

module.exports = router;
