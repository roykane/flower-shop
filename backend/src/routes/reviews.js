const express = require('express');
const { body, validationResult } = require('express-validator');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');
const { protect, admin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/reviews
// @desc    Get all reviews (for homepage/reviews page)
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isApproved: true };

    // Filter by product
    if (req.query.product) {
      query.product = req.query.product;
    }

    // Filter by rating
    if (req.query.rating) {
      query.rating = parseInt(req.query.rating);
    }

    // Sort
    let sort = {};
    switch (req.query.sort) {
      case 'highest':
        sort = { rating: -1 };
        break;
      case 'lowest':
        sort = { rating: 1 };
        break;
      case 'helpful':
        sort = { helpfulCount: -1 };
        break;
      default:
        sort = { createdAt: -1 };
    }

    const total = await Review.countDocuments(query);
    const reviews = await Review.find(query)
      .populate('user', 'name')
      .populate('product', 'name images slug')
      .sort(sort)
      .skip(skip)
      .limit(limit);

    // Get rating distribution
    const ratingStats = await Review.aggregate([
      { $match: { isApproved: true } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: -1 } },
    ]);

    const totalReviews = await Review.countDocuments({ isApproved: true });
    const avgRating = await Review.aggregate([
      { $match: { isApproved: true } },
      { $group: { _id: null, avg: { $avg: '$rating' } } },
    ]);

    res.json({
      success: true,
      data: reviews,
      stats: {
        total: totalReviews,
        average: avgRating[0]?.avg || 0,
        distribution: ratingStats,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/reviews/product/:productId
// @desc    Get reviews for a specific product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    const { productId } = req.params;

    // Validate productId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID',
      });
    }

    const reviews = await Review.find({
      product: productId,
      isApproved: true,
    })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    // Get rating stats for this product
    let stats = [];
    try {
      stats = await Review.aggregate([
        {
          $match: {
            product: new mongoose.Types.ObjectId(productId),
            isApproved: true,
          },
        },
        {
          $group: {
            _id: '$rating',
            count: { $sum: 1 },
          },
        },
      ]);
    } catch (aggError) {
      console.error('Aggregate error:', aggError);
    }

    res.json({
      success: true,
      data: reviews,
      stats: stats.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
    });
  } catch (error) {
    console.error('Get product reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/reviews
// @desc    Create a review
// @access  Private
router.post(
  '/',
  protect,
  [
    body('product').notEmpty().withMessage('Product is required'),
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment')
      .trim()
      .isLength({ min: 10 })
      .withMessage('Comment must be at least 10 characters'),
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

      const { product, rating, comment, images } = req.body;

      // Check if product exists
      const productExists = await Product.findById(product);
      if (!productExists) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      // Check if user already reviewed this product
      const existingReview = await Review.findOne({
        user: req.user._id,
        product,
      });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this product',
        });
      }

      // Check if user has purchased this product
      const hasPurchased = await Order.findOne({
        user: req.user._id,
        'items.product': product,
        orderStatus: 'delivered',
      });

      const review = await Review.create({
        user: req.user._id,
        product,
        rating,
        comment,
        images: images || [],
        isVerifiedPurchase: !!hasPurchased,
        isApproved: true, // Auto-approve reviews
      });

      await review.populate('user', 'name');
      await review.populate('product', 'name images');

      res.status(201).json({
        success: true,
        data: review,
      });
    } catch (error) {
      console.error('Create review error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/reviews/:id
// @desc    Update a review
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
  try {
    const { rating, comment, images } = req.body;

    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership
    if (review.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this review',
      });
    }

    review.rating = rating || review.rating;
    review.comment = comment || review.comment;
    review.images = images || review.images;

    await review.save();

    await review.populate('user', 'name');
    await review.populate('product', 'name images');

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/reviews/:id
// @desc    Delete a review
// @access  Private (owner or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Check ownership or admin
    if (
      review.user.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this review',
      });
    }

    const productId = review.product;
    await review.deleteOne();

    // Recalculate product rating
    await Review.calculateAverageRating(productId);

    res.json({
      success: true,
      message: 'Review deleted successfully',
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/reviews/:id/helpful
// @desc    Mark review as helpful
// @access  Public
router.put('/:id/helpful', async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { $inc: { helpfulCount: 1 } },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   PUT /api/reviews/:id/approve
// @desc    Approve/disapprove a review
// @access  Admin
router.put('/:id/approve', protect, admin, async (req, res) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: req.body.isApproved },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found',
      });
    }

    // Recalculate product rating
    await Review.calculateAverageRating(review.product);

    res.json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Approve review error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
