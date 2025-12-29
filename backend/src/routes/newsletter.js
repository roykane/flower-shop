const express = require('express');
const { body, validationResult } = require('express-validator');
const Newsletter = require('../models/Newsletter');
const { protect, admin } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Admin email để nhận thông báo khi có người đăng ký
const ADMIN_EMAIL = 'nghile1900@gmail.com';

/**
 * @route   POST /api/newsletter/subscribe
 * @desc    Subscribe to newsletter
 * @access  Public
 */
router.post(
  '/subscribe',
  [
    body('email')
      .isEmail()
      .withMessage('Email không hợp lệ')
      .normalizeEmail(),
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

      const { email } = req.body;

      // Check if email already subscribed
      const existingSubscriber = await Newsletter.findOne({ email });
      if (existingSubscriber) {
        if (existingSubscriber.isActive) {
          return res.status(400).json({
            success: false,
            message: 'Email này đã đăng ký nhận ưu đãi rồi!',
          });
        } else {
          // Reactivate subscription
          existingSubscriber.isActive = true;
          existingSubscriber.subscribedAt = new Date();
          await existingSubscriber.save();

          // Log notification to admin
          logger.logNewsletter(email, 'Resubscribed');
          logger.info(`Newsletter notification to admin: ${ADMIN_EMAIL}`);

          return res.json({
            success: true,
            message: 'Đăng ký nhận ưu đãi thành công!',
          });
        }
      }

      // Create new subscriber
      const subscriber = await Newsletter.create({
        email,
        source: 'website',
      });

      // Log notification to admin
      logger.logNewsletter(email, 'New subscription');
      logger.info(`Newsletter notification to admin: ${ADMIN_EMAIL}`, {
        subscribedAt: new Date().toISOString(),
      });

      // TODO: Gửi email thực sự khi có SMTP server
      // await sendEmail({
      //   to: ADMIN_EMAIL,
      //   subject: '[MINH ANH] Đăng ký nhận ưu đãi mới',
      //   html: `
      //     <h2>Có người đăng ký nhận ưu đãi mới!</h2>
      //     <p><strong>Email:</strong> ${email}</p>
      //     <p><strong>Thời gian:</strong> ${new Date().toLocaleString('vi-VN')}</p>
      //   `
      // });

      res.status(201).json({
        success: true,
        message: 'Đăng ký nhận ưu đãi thành công! Cảm ơn bạn.',
      });
    } catch (error) {
      logger.error('Newsletter subscribe error:', { error: error.message });
      res.status(500).json({
        success: false,
        message: 'Có lỗi xảy ra. Vui lòng thử lại sau.',
      });
    }
  }
);

/**
 * @route   POST /api/newsletter/unsubscribe
 * @desc    Unsubscribe from newsletter
 * @access  Public
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email là bắt buộc',
      });
    }

    const subscriber = await Newsletter.findOne({ email: email.toLowerCase() });
    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Email chưa đăng ký nhận ưu đãi',
      });
    }

    subscriber.isActive = false;
    await subscriber.save();

    res.json({
      success: true,
      message: 'Hủy đăng ký thành công',
    });
  } catch (error) {
    logger.error('Newsletter unsubscribe error:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Có lỗi xảy ra',
    });
  }
});

/**
 * @route   GET /api/newsletter/subscribers
 * @desc    Get all subscribers (Admin only)
 * @access  Private/Admin
 */
router.get('/subscribers', protect, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const status = req.query.status; // 'active', 'inactive', or undefined for all

    const query = {};
    if (status === 'active') query.isActive = true;
    if (status === 'inactive') query.isActive = false;

    const total = await Newsletter.countDocuments(query);
    const subscribers = await Newsletter.find(query)
      .sort({ subscribedAt: -1 })
      .skip(skip)
      .limit(limit);

    // Get stats
    const totalActive = await Newsletter.countDocuments({ isActive: true });
    const totalInactive = await Newsletter.countDocuments({ isActive: false });

    res.json({
      success: true,
      data: subscribers,
      stats: {
        total: totalActive + totalInactive,
        active: totalActive,
        inactive: totalInactive,
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get subscribers error:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   DELETE /api/newsletter/:id
 * @desc    Delete subscriber (Admin only)
 * @access  Private/Admin
 */
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const subscriber = await Newsletter.findByIdAndDelete(req.params.id);

    if (!subscriber) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy subscriber',
      });
    }

    res.json({
      success: true,
      message: 'Đã xóa subscriber',
    });
  } catch (error) {
    logger.error('Delete subscriber error:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

/**
 * @route   GET /api/newsletter/export
 * @desc    Export subscribers as CSV (Admin only)
 * @access  Private/Admin
 */
router.get('/export', protect, admin, async (req, res) => {
  try {
    const subscribers = await Newsletter.find({ isActive: true })
      .sort({ subscribedAt: -1 })
      .select('email subscribedAt source');

    // Create CSV content
    const csvHeader = 'Email,Ngày đăng ký,Nguồn\n';
    const csvRows = subscribers.map(s =>
      `${s.email},${new Date(s.subscribedAt).toLocaleDateString('vi-VN')},${s.source}`
    ).join('\n');

    const csvContent = csvHeader + csvRows;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=subscribers_${Date.now()}.csv`);
    res.send('\ufeff' + csvContent); // BOM for Excel UTF-8 compatibility
  } catch (error) {
    logger.error('Export subscribers error:', { error: error.message });
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
});

module.exports = router;
