const express = require('express');
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const { protect, admin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/products
// @desc    Get all products
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by active status (public sees only active)
    if (!req.query.all) {
      query.isActive = true;
    }

    // Filter by category
    if (req.query.category) {
      const category = await Category.findOne({ slug: req.query.category });
      if (category) {
        query.category = category._id;
      }
    }

    // Filter by price range
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = parseFloat(req.query.minPrice);
      if (req.query.maxPrice) query.price.$lte = parseFloat(req.query.maxPrice);
    }

    // Search
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // Featured only
    if (req.query.featured === 'true') {
      query.featured = true;
    }

    // In stock only
    if (req.query.inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Sort
    let sort = {};
    switch (req.query.sort) {
      case 'price-low':
        sort = { price: 1 };
        break;
      case 'price-high':
        sort = { price: -1 };
        break;
      case 'rating':
        sort = { averageRating: -1 };
        break;
      case 'popular':
        sort = { totalReviews: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/products/featured
// @desc    Get featured products
// @access  Public
router.get('/featured', async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, featured: true })
      .populate('category', 'name slug')
      .limit(8);

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/products/:slug
// @desc    Get product by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const product = await Product.findOne({
      $or: [{ slug: req.params.slug }, { _id: req.params.slug }],
    }).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    // Get related products
    const related = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isActive: true,
    })
      .populate('category', 'name slug')
      .limit(4);

    res.json({
      success: true,
      data: {
        product,
        related,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/products
// @desc    Create a product
// @access  Admin
router.post(
  '/',
  protect,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Product name is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('images').isArray({ min: 1 }).withMessage('At least one image is required'),
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

      const {
        name,
        description,
        price,
        category,
        images,
        stock,
        tags,
        featured,
      } = req.body;

      // Check if category exists
      const categoryExists = await Category.findById(category);
      if (!categoryExists) {
        return res.status(400).json({
          success: false,
          message: 'Category not found',
        });
      }

      const product = await Product.create({
        name,
        description,
        price,
        category,
        images,
        stock: stock || 0,
        tags: tags || [],
        featured: featured || false,
      });

      await product.populate('category', 'name slug');

      res.status(201).json({
        success: true,
        data: product,
      });
    } catch (error) {
      console.error('Create product error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/products/:id
// @desc    Update a product
// @access  Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      category,
      images,
      stock,
      tags,
      featured,
      isActive,
    } = req.body;

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        category,
        images,
        stock,
        tags,
        featured,
        isActive,
      },
      { new: true, runValidators: true }
    ).populate('category', 'name slug');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/products/:id
// @desc    Delete a product
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
