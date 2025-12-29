const express = require('express');
const { body, validationResult } = require('express-validator');
const Coupon = require('../models/Coupon');
const { protect, admin, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/coupons/validate
// @desc    Validate a coupon code
// @access  Public (with optional auth)
router.post('/validate', optionalAuth, async (req, res) => {
  try {
    const { code, orderAmount, phone, cartItems } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập mã giảm giá',
      });
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Mã giảm giá không tồn tại',
      });
    }

    // Validate coupon for this order
    const validation = coupon.validateForOrder(
      orderAmount || 0,
      req.user?._id,
      phone,
      cartItems || []
    );

    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors[0],
        errors: validation.errors,
      });
    }

    // Calculate discount
    const discount = coupon.calculateDiscount(orderAmount || 0);

    res.json({
      success: true,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discount,
        minOrderAmount: coupon.minOrderAmount,
        maxDiscountAmount: coupon.maxDiscountAmount,
      },
    });
  } catch (error) {
    console.error('Validate coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// @route   GET /api/coupons/available
// @desc    Get available coupons for display
// @access  Public
router.get('/available', async (req, res) => {
  try {
    const now = new Date();

    const coupons = await Coupon.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
    })
      .select('code description discountType discountValue minOrderAmount maxDiscountAmount endDate')
      .sort({ discountValue: -1 })
      .limit(10);

    res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    console.error('Get available coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

// ============================================
// ADMIN ROUTES
// ============================================

// @route   GET /api/coupons
// @desc    Get all coupons (admin)
// @access  Admin
router.get('/', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const query = {};

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

    // Search by code
    if (req.query.search) {
      query.code = { $regex: req.query.search, $options: 'i' };
    }

    const total = await Coupon.countDocuments(query);
    const coupons = await Coupon.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get coupons error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/coupons/:id
// @desc    Get coupon by ID
// @access  Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id)
      .populate('applicableProducts', 'name images')
      .populate('applicableCategories', 'name');

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    res.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Get coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   POST /api/coupons
// @desc    Create a coupon
// @access  Admin
router.post(
  '/',
  protect,
  admin,
  [
    body('code').trim().notEmpty().withMessage('Vui lòng nhập mã giảm giá'),
    body('description').trim().notEmpty().withMessage('Vui lòng nhập mô tả'),
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
        code,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        usageLimitPerUser,
        startDate,
        endDate,
        applicableCategories,
        applicableProducts,
        excludedProducts,
      } = req.body;

      // Check if code already exists
      const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
      if (existingCoupon) {
        return res.status(400).json({
          success: false,
          message: 'Mã giảm giá đã tồn tại',
        });
      }

      // Validate percentage
      if (discountType === 'percentage' && discountValue > 100) {
        return res.status(400).json({
          success: false,
          message: 'Phần trăm giảm giá không được vượt quá 100%',
        });
      }

      const coupon = await Coupon.create({
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minOrderAmount: minOrderAmount || 0,
        maxDiscountAmount: maxDiscountAmount || null,
        usageLimit: usageLimit || null,
        usageLimitPerUser: usageLimitPerUser || 1,
        startDate,
        endDate,
        applicableCategories: applicableCategories || [],
        applicableProducts: applicableProducts || [],
        excludedProducts: excludedProducts || [],
      });

      res.status(201).json({
        success: true,
        data: coupon,
      });
    } catch (error) {
      console.error('Create coupon error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error',
      });
    }
  }
);

// @route   PUT /api/coupons/:id
// @desc    Update a coupon
// @access  Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    const {
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscountAmount,
      usageLimit,
      usageLimitPerUser,
      startDate,
      endDate,
      isActive,
      applicableCategories,
      applicableProducts,
      excludedProducts,
    } = req.body;

    // Update fields
    if (description) coupon.description = description;
    if (discountType) coupon.discountType = discountType;
    if (discountValue !== undefined) coupon.discountValue = discountValue;
    if (minOrderAmount !== undefined) coupon.minOrderAmount = minOrderAmount;
    if (maxDiscountAmount !== undefined) coupon.maxDiscountAmount = maxDiscountAmount;
    if (usageLimit !== undefined) coupon.usageLimit = usageLimit;
    if (usageLimitPerUser !== undefined) coupon.usageLimitPerUser = usageLimitPerUser;
    if (startDate) coupon.startDate = startDate;
    if (endDate) coupon.endDate = endDate;
    if (isActive !== undefined) coupon.isActive = isActive;
    if (applicableCategories) coupon.applicableCategories = applicableCategories;
    if (applicableProducts) coupon.applicableProducts = applicableProducts;
    if (excludedProducts) coupon.excludedProducts = excludedProducts;

    await coupon.save();

    res.json({
      success: true,
      data: coupon,
    });
  } catch (error) {
    console.error('Update coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   DELETE /api/coupons/:id
// @desc    Delete a coupon
// @access  Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy mã giảm giá',
      });
    }

    await coupon.deleteOne();

    res.json({
      success: true,
      message: 'Đã xóa mã giảm giá',
    });
  } catch (error) {
    console.error('Delete coupon error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

// @route   GET /api/coupons/stats/overview
// @desc    Get coupon usage statistics
// @access  Admin
router.get('/stats/overview', protect, admin, async (req, res) => {
  try {
    const now = new Date();

    const [totalCoupons, activeCoupons, totalUsage, topCoupons] = await Promise.all([
      Coupon.countDocuments(),
      Coupon.countDocuments({
        isActive: true,
        startDate: { $lte: now },
        endDate: { $gte: now },
      }),
      Coupon.aggregate([
        { $group: { _id: null, total: { $sum: '$usedCount' } } },
      ]),
      Coupon.find()
        .sort({ usedCount: -1 })
        .limit(5)
        .select('code description usedCount discountType discountValue'),
    ]);

    res.json({
      success: true,
      data: {
        totalCoupons,
        activeCoupons,
        totalUsage: totalUsage[0]?.total || 0,
        topCoupons,
      },
    });
  } catch (error) {
    console.error('Get coupon stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
