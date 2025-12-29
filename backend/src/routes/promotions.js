const express = require('express');
const { body, validationResult } = require('express-validator');
const Promotion = require('../models/Promotion');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// @route   GET /api/promotions/active
// @desc    Get all active promotions
// @access  Public
router.get('/active', async (req, res) => {
  try {
    const type = req.query.type || null;
    const promotions = await Promotion.getActivePromotions(type);

    res.json({
      success: true,
      data: promotions,
    });
  } catch (error) {
    console.error('Get active promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// @route   GET /api/promotions/flash-sale
// @desc    Get current flash sale for homepage
// @access  Public
router.get('/flash-sale', async (req, res) => {
  try {
    const flashSales = await Promotion.getFlashSales();
    const flashSale = flashSales[0] || null;

    if (!flashSale) {
      return res.json({
        success: true,
        data: null,
      });
    }

    // Format response
    res.json({
      success: true,
      data: {
        _id: flashSale._id,
        name: flashSale.name,
        slug: flashSale.slug,
        description: flashSale.description,
        discountType: flashSale.discountType,
        discountValue: flashSale.discountValue,
        startDate: flashSale.startDate,
        endDate: flashSale.endDate,
        bannerImage: flashSale.bannerImage,
        bannerImageMobile: flashSale.bannerImageMobile,
        primaryColor: flashSale.primaryColor,
        secondaryColor: flashSale.secondaryColor,
        showCountdown: flashSale.showCountdown,
        timeRemaining: flashSale.timeRemaining,
        products: flashSale.products.map(p => ({
          _id: p.product._id,
          name: p.product.name,
          slug: p.product.slug,
          price: p.product.price,
          salePrice: flashSale.getSalePrice(p.product._id, p.product.price),
          images: p.product.images,
          stock: p.product.stock,
          stockLimit: p.stockLimit,
          soldCount: p.soldCount,
          discountPercent: flashSale.discountType === 'percentage'
            ? (p.customDiscount !== null ? p.customDiscount : flashSale.discountValue)
            : Math.round(((p.product.price - flashSale.getSalePrice(p.product._id, p.product.price)) / p.product.price) * 100),
        })),
      },
    });
  } catch (error) {
    console.error('Get flash sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// @route   GET /api/promotions/product/:productId
// @desc    Get active promotion for a specific product
// @access  Public
router.get('/product/:productId', async (req, res) => {
  try {
    const promotion = await Promotion.getProductPromotion(req.params.productId);

    if (!promotion) {
      return res.json({
        success: true,
        data: null,
      });
    }

    const productPromo = promotion.products.find(
      p => p.product._id.toString() === req.params.productId
    );

    res.json({
      success: true,
      data: {
        promotionId: promotion._id,
        name: promotion.name,
        type: promotion.type,
        discountType: promotion.discountType,
        discountValue: productPromo?.customDiscount !== null
          ? productPromo.customDiscount
          : promotion.discountValue,
        endDate: promotion.endDate,
        timeRemaining: promotion.timeRemaining,
        stockLimit: productPromo?.stockLimit,
        soldCount: productPromo?.soldCount,
      },
    });
  } catch (error) {
    console.error('Get product promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// @route   GET /api/promotions/:slug
// @desc    Get promotion by slug
// @access  Public
router.get('/:slug', async (req, res) => {
  try {
    const promotion = await Promotion.findOne({ slug: req.params.slug })
      .populate('products.product', 'name slug price salePrice images stock')
      .populate('categories', 'name slug');

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi',
      });
    }

    res.json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.error('Get promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// @route   GET /api/promotions
// @desc    Get all promotions (admin)
// @access  Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by status
    if (req.query.status === 'active') {
      const now = new Date();
      query.isActive = true;
      query.startDate = { $lte: now };
      query.endDate = { $gte: now };
    } else if (req.query.status === 'expired') {
      query.endDate = { $lt: new Date() };
    } else if (req.query.status === 'upcoming') {
      query.startDate = { $gt: new Date() };
    }

    const total = await Promotion.countDocuments(query);
    const promotions = await Promotion.find(query)
      .populate('products.product', 'name images price')
      .populate('categories', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: promotions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/promotions
// @desc    Create a promotion
// @access  Admin
router.post(
  '/',
  protect,
  admin,
  [
    body('name').trim().notEmpty().withMessage('Vui lòng nhập tên khuyến mãi'),
    body('type')
      .isIn(['flash_sale', 'seasonal', 'holiday', 'clearance', 'bundle'])
      .withMessage('Loại khuyến mãi không hợp lệ'),
    body('discountType')
      .isIn(['percentage', 'fixed'])
      .withMessage('Loại giảm giá không hợp lệ'),
    body('discountValue')
      .isFloat({ min: 0 })
      .withMessage('Giá trị giảm giá không hợp lệ'),
    body('startDate').isISO8601().withMessage('Ngày bắt đầu không hợp lệ'),
    body('endDate').isISO8601().withMessage('Ngày kết thúc không hợp lệ'),
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
        slug,
        description,
        type,
        discountType,
        discountValue,
        startDate,
        endDate,
        priority,
        products,
        categories,
        bannerImage,
        bannerImageMobile,
        primaryColor,
        secondaryColor,
        showCountdown,
        isFeatured,
      } = req.body;

      // Validate percentage
      if (discountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'Phần trăm giảm giá không được vượt quá 100%',
        });
      }

      const promotion = await Promotion.create({
        name,
        slug,
        description,
        type,
        discountType,
        discountValue,
        startDate,
        endDate,
        priority: priority || 0,
        products: products || [],
        categories: categories || [],
        bannerImage,
        bannerImageMobile,
        primaryColor,
        secondaryColor,
        showCountdown: showCountdown !== false,
        isFeatured: isFeatured || false,
      });

      res.status(201).json({
        success: true,
        data: promotion,
      });
    } catch (error) {
      console.error('Create promotion error:', error);
      if (error.code === 11000) {
        return res.status(400).json({
          success: false,
          message: 'Slug đã tồn tại',
        });
      }
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/promotions/:id
// @desc    Update a promotion
// @access  Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi',
      });
    }

    const allowedFields = [
      'name', 'slug', 'description', 'type', 'discountType', 'discountValue',
      'startDate', 'endDate', 'isActive', 'priority', 'products', 'categories',
      'bannerImage', 'bannerImageMobile', 'primaryColor', 'secondaryColor',
      'showCountdown', 'isFeatured',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        promotion[field] = req.body[field];
      }
    });

    await promotion.save();

    res.json({
      success: true,
      data: promotion,
    });
  } catch (error) {
    console.error('Update promotion error:', error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Slug đã tồn tại',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/promotions/:id
// @desc    Delete a promotion
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);

    if (!promotion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy khuyến mãi',
      });
    }

    await promotion.deleteOne();

    res.json({
      success: true,
      message: 'Đã xóa khuyến mãi',
    });
  } catch (error) {
    console.error('Delete promotion error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
