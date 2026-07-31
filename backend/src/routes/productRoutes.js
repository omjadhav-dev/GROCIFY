const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');
const { protect, wholesalerOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');

// Helper: delete an old uploaded image file when it's replaced/removed
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
    // Optional: filter by wholesaler or category via query params
    const filter = {};
    if (req.query.wholesaler) filter.wholesaler = req.query.wholesaler;
    if (req.query.category) filter.category = req.query.category;

    const products = await Product.find(filter).populate('wholesaler', 'name email mobile');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// @route   GET /api/products/my
// @desc    Get products listed by the logged-in wholesaler
// @access  Private - Wholesaler only
router.get('/my', protect, wholesalerOnly, async (req, res) => {
  try {
    const products = await Product.find({ wholesaler: req.user._id });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your products' });
  }
});

// @route   POST /api/products
// @desc    Add a new product (wholesaler only)
// @access  Private - Wholesaler only
router.post('/', protect, wholesalerOnly, upload.single('image'), async (req, res) => {
  const { name, description, price, stock, unit, category } = req.body;

  if (!name || !price || stock === undefined) {
    return res.status(400).json({ message: 'Name, price, and stock are required' });
  }

  try {
    const image = req.file ? `/uploads/${req.file.filename}` : '';

    const product = await Product.create({
      name,
      description,
      price,
      stock,
      unit: unit || 'piece',
      category: category || 'General',
      image,
      wholesaler: req.user._id,
      wholesalerName: req.user.name,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Error adding product' });
  }
});

// @route   PUT /api/products/:id
// @desc    Update a product (wholesaler only, must own it)
// @access  Private - Wholesaler only
router.put('/:id', protect, wholesalerOnly, upload.single('image'), async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Make sure the wholesaler owns this product
    if (product.wholesaler.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const { name, description, price, stock, unit, category, removeImage } = req.body;

    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.unit = unit || product.unit;
    product.category = category || product.category;

    if (req.file) {
      // A new image was uploaded — replace the old one
      deleteImageFile(product.image);
      product.image = `/uploads/${req.file.filename}`;
    } else if (removeImage === 'true') {
      // User explicitly cleared the image
      deleteImageFile(product.image);
      product.image = '';
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Error updating product' });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product (wholesaler only, must own it)
// @access  Private - Wholesaler only
router.delete('/:id', protect, wholesalerOnly, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.wholesaler.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this product' });
    }

    await product.deleteOne();
    deleteImageFile(product.image);
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// Handle multer errors (bad file type, too large, etc.) with a clean JSON response
router.use((err, req, res, next) => {
  if (err && err.message) {
    return res.status(400).json({ message: err.message });
  }
  next(err);
});

module.exports = router;
