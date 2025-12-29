const express = require('express');
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res) => {
  try {
    const query = req.query.active === 'true' ? { isActive: true } : {};
    const categories = await Category.find(query).sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/categories/:id/products
// @desc    Get products by category ID
// @access  Public
router.get('/:id/products', async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm sản phẩm theo category ID
    const products = await Product.find({
      category: id,
    }).populate('category', 'name slug');

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get products by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/categories/:slug
// @desc    Get category by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const category = await Category.findOne({ slug: req.params.slug });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    // Get products in this category
    const products = await Product.find({
      category: category._id,
    }).populate('category', 'name slug');

    res.json({
      success: true,
      data: {
        category,
        products,
      },
    });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/categories
// @desc    Create a category
// @access  Admin
router.post(
  '/',
  protect,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Category name is required'),
    body('image').notEmpty().withMessage('Image is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: errors.array()[0].msg,
        });
      }

      const { name, description, image } = req.body;

      // Check if category exists
      const existing = await Category.findOne({ name });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Category already exists',
        });
      }

      const category = await Category.create({ name, description, image });

      res.status(201).json({
        success: true,
        data: category,
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/categories/:id
// @desc    Update a category
// @access  Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, description, image, isActive } = req.body;

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image, isActive },
      { new: true, runValidators: true }
    );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/categories/:id
// @desc    Delete a category
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    // Check if category has products
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category with ${productCount} products`,
      });
    }

    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found',
      });
    }

    res.json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
