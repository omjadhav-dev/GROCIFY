const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { body } = require('express-validator');
const { Product, ProductVariant, User, Review } = require('../models');
const { protect, wholesalerOnly } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const sequelize = require('../config/db');

const deleteImageFile = (imagePath) => {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  const fullPath = path.join(__dirname, '..', imagePath);
  fs.unlink(fullPath, (err) => {
    if (err && err.code !== 'ENOENT') console.error('Failed to delete old image:', err.message);
  });
};

// Parses the `variants` field sent alongside a product form (a JSON string,
// since this is a multipart/form-data request). Returns [] on anything
// invalid/empty rather than throwing, since variants are optional.
const parseVariants = (raw) => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((v) => v && v.label && v.price !== undefined && v.price !== '')
      .map((v) => ({
        label: String(v.label).trim(),
        price: v.price,
        stock: v.stock ?? 0,
        lowStockThreshold: v.lowStockThreshold ?? 5,
        minOrderQty: v.minOrderQty ?? 1,
      }));
  } catch {
    return [];
  }
};

// Attaches { averageRating, reviewCount } for each product's wholesaler, in
// one extra grouped query rather than one query per product.
const attachWholesalerRatings = async (products) => {
  const wholesalerIds = [...new Set(products.map((p) => p.wholesalerId))];
  if (wholesalerIds.length === 0) return products;

  const rows = await Review.findAll({
    where: { wholesalerId: wholesalerIds },
    attributes: [
      'wholesalerId',
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'reviewCount'],
    ],
    group: ['wholesalerId'],
  });
  const ratingMap = Object.fromEntries(
    rows.map((r) => [r.wholesalerId, { averageRating: Number(r.get('averageRating')), reviewCount: Number(r.get('reviewCount')) }])
  );

  return products.map((p) => {
    const json = p.toJSON();
    json.wholesalerRating = ratingMap[p.wholesalerId] || { averageRating: null, reviewCount: 0 };
    return json;
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
      include: [
        { model: User, as: 'wholesaler', attributes: ['id', 'name', 'email', 'mobile'] },
        { model: ProductVariant, as: 'variants' },
      ],
      order: [['createdAt', 'DESC']],
    });
    res.json(await attachWholesalerRatings(products));
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
      include: [{ model: ProductVariant, as: 'variants' }],
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
    const { name, description, price, stock, lowStockThreshold, minOrderQty, unit, packSize, category, variants } = req.body;
    const t = await sequelize.transaction();
    try {
      const image = req.file ? `/uploads/${req.file.filename}` : '';

      const product = await Product.create(
        {
          name,
          description,
          price,
          stock,
          lowStockThreshold: lowStockThreshold !== undefined && lowStockThreshold !== '' ? lowStockThreshold : 5,
          minOrderQty: minOrderQty !== undefined && minOrderQty !== '' ? minOrderQty : 1,
          unit: unit || 'piece',
          packSize: packSize || '',
          category: category || 'General',
          image,
          wholesalerId: req.user.id,
          wholesalerName: req.user.name,
        },
        { transaction: t }
      );

      const variantRows = parseVariants(variants);
      if (variantRows.length > 0) {
        await ProductVariant.bulkCreate(
          variantRows.map((v) => ({ ...v, productId: product.id })),
          { transaction: t }
        );
      }

      await t.commit();

      const full = await Product.findByPk(product.id, { include: [{ model: ProductVariant, as: 'variants' }] });
      res.status(201).json(full);
    } catch (error) {
      await t.rollback();
      console.error(error);
      res.status(500).json({ message: 'Error adding product' });
    }
  }
);

// @route   PUT /api/products/:id
// @desc    Update a product (wholesaler only, must own it)
// @access  Private - Wholesaler only
router.put('/:id', protect, wholesalerOnly, upload.single('image'), async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const product = await Product.findByPk(req.params.id, { transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(404).json({ message: 'Product not found' });
    }

    if (product.wholesalerId !== req.user.id) {
      await t.rollback();
      return res.status(403).json({ message: 'Not authorized to edit this product' });
    }

    const { name, description, price, stock, lowStockThreshold, minOrderQty, unit, packSize, category, removeImage, variants } = req.body;

    product.name = name || product.name;
    product.description = description !== undefined ? description : product.description;
    product.price = price !== undefined ? price : product.price;
    product.stock = stock !== undefined ? stock : product.stock;
    product.lowStockThreshold = lowStockThreshold !== undefined ? lowStockThreshold : product.lowStockThreshold;
    product.minOrderQty = minOrderQty !== undefined ? minOrderQty : product.minOrderQty;
    product.unit = unit || product.unit;
    product.packSize = packSize !== undefined ? packSize : product.packSize;
    product.category = category || product.category;

    if (req.file) {
      deleteImageFile(product.image);
      product.image = `/uploads/${req.file.filename}`;
    } else if (removeImage === 'true') {
      deleteImageFile(product.image);
      product.image = '';
    }

    await product.save({ transaction: t });

    // Variants are replaced wholesale on edit — simpler and safer than
    // diffing individual rows, and this form always sends the full set.
    if (variants !== undefined) {
      await ProductVariant.destroy({ where: { productId: product.id }, transaction: t });
      const variantRows = parseVariants(variants);
      if (variantRows.length > 0) {
        await ProductVariant.bulkCreate(
          variantRows.map((v) => ({ ...v, productId: product.id })),
          { transaction: t }
        );
      }
    }

    await t.commit();

    const full = await Product.findByPk(product.id, { include: [{ model: ProductVariant, as: 'variants' }] });
    res.json(full);
  } catch (error) {
    await t.rollback();
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

    await product.destroy(); // cascades to its variants
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
